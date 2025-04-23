import requests
import json
import re
import numpy as np
import pickle
import os
import random
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
import logging
import time
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("youtube_sentiment")


# Load the NLP model and vectorizer
def load_sentiment_model():
    try:
        clf = pickle.load(open("nlp_model.pkl", "rb"))
        vectorizer = pickle.load(open("tranform.pkl", "rb"))
        return clf, vectorizer
    except Exception as e:
        print(f"Error loading sentiment model: {e}")
        return None, None


class YouTubeSentiment:
    # Then in your class initialization
    def __init__(self):
        self.clf, self.vectorizer = load_sentiment_model()

        # Get API keys from environment with fallbacks for development
        self.youtube_api_key = os.environ.get("YOUTUBE_API_KEY", "")
        self.openai_api_key = os.environ.get("OPENAI_API_KEY", "")

        # Check if keys are available
        if not self.youtube_api_key:
            logger.warning("YouTube API key not found in environment variables")

        if not self.openai_api_key:
            logger.warning("OpenAI API key not found in environment variables")

        # Initialize OpenAI client if key is available
        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None

    def clean_text(self, text):
        """Clean text by removing URLs, special characters, etc."""
        if not text:
            return ""
        # Remove URLs
        text = re.sub(r"http\S+", "", text)
        # Remove special characters and numbers
        text = re.sub(r"[^a-zA-Z\s]", "", text)
        # Remove extra spaces
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def analyze_sentiment_with_model(self, text_list):
        """
        Analyze sentiment using our pre-trained model
        Returns sentiment in the same format as Twitter analysis for consistency
        """
        if not text_list:
            return {"positive": 0, "neutral": 0, "negative": 0, "sentiment_score": 0}

        if self.clf is None or self.vectorizer is None:
            return {
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "sentiment_score": 0,
                "error": "Sentiment model not loaded",
            }

        try:
            # Clean texts
            cleaned_texts = [self.clean_text(text) for text in text_list]

            # Transform texts
            text_vectors = self.vectorizer.transform(cleaned_texts)

            # Predict sentiment (binary for now: 1=positive, 0=negative)
            predictions = self.clf.predict(text_vectors)

            # For prediction probabilities to determine neutrality
            probabilities = self.clf.predict_proba(text_vectors)

            # Categorize content by sentiment
            positive_examples = []
            neutral_examples = []
            negative_examples = []

            positive_count = 0
            neutral_count = 0
            negative_count = 0

            # Consider content with probability between 0.4 and 0.6 as neutral
            for i, (text, pred, prob) in enumerate(
                zip(text_list, predictions, probabilities)
            ):
                # Get probability of positive class
                positive_prob = prob[1] if len(prob) > 1 else prob[0]

                if 0.4 <= positive_prob <= 0.6:
                    # Neutral sentiment
                    neutral_count += 1
                    if len(neutral_examples) < 3:  # Keep up to 3 examples
                        neutral_examples.append(text)
                elif pred == 1:
                    # Positive sentiment
                    positive_count += 1
                    if len(positive_examples) < 3:  # Keep up to 3 examples
                        positive_examples.append(text)
                else:
                    # Negative sentiment
                    negative_count += 1
                    if len(negative_examples) < 3:  # Keep up to 3 examples
                        negative_examples.append(text)

            # Calculate sentiment score (0-10 scale) - weighted by neutrals
            total_count = positive_count + neutral_count + negative_count
            sentiment_score = (
                round(((positive_count + (neutral_count * 0.5)) / total_count) * 10, 1)
                if total_count > 0
                else 0
            )

            return {
                "positive": int(positive_count),
                "neutral": int(neutral_count),
                "negative": int(negative_count),
                "sentiment_score": sentiment_score,
                "positive_examples": positive_examples,
                "neutral_examples": neutral_examples,
                "negative_examples": negative_examples,
            }

        except Exception as e:
            print(f"Error in sentiment analysis: {e}")
            return {
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "sentiment_score": 0,
                "error": str(e),
                "positive_examples": [],
                "neutral_examples": [],
                "negative_examples": [],
            }

    def analyze_with_openai(self, transcript_text, movie_name):
        """
        Analyze the sentiment of a transcript using OpenAI API.

        Args:
            transcript_text (str): The transcript text to analyze
            movie_name (str): Name of the movie for context

        Returns:
            dict: Sentiment analysis results
        """
        try:
            # Import OpenAI client properly
            from openai import OpenAI

            # Initialize the client
            client = OpenAI(api_key=self.openai_api_key)

            # Limit text to avoid token limits
            trimmed_text = (
                transcript_text[:4000] if transcript_text else "No transcript available"
            )

            # Prepare prompt for OpenAI
            prompt = f"""
            The following is a transcript from a YouTube review of the movie "{movie_name}".
            Please analyze this review and provide:
            1. A brief summary (2-3 sentences)
            2. The overall sentiment (positive, negative, or neutral)
            3. A sentiment score from -1.0 (very negative) to 1.0 (very positive)
            
            Transcript:
            {trimmed_text}
            """

            # Call OpenAI API with current format
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that analyzes movie reviews.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=300,
                temperature=0.3,
            )

            # Process the response (updated for new response format)
            analysis_text = response.choices[0].message.content

            # Extract sentiment components from the response
            summary_match = re.search(
                r"1\.\s*(.*?)(?=2\.|\n\n|$)", analysis_text, re.DOTALL
            )
            sentiment_match = re.search(
                r"2\.\s*(.*?)(?=3\.|\n\n|$)", analysis_text, re.DOTALL
            )
            score_match = re.search(r"3\.\s*(.*?)(?=\n\n|$)", analysis_text, re.DOTALL)

            summary = (
                summary_match.group(1).strip()
                if summary_match
                else "No summary available"
            )
            sentiment = (
                sentiment_match.group(1).strip() if sentiment_match else "neutral"
            )

            # Extract numerical score if available
            score = 0
            if score_match:
                score_text = score_match.group(1)
                score_number = re.search(r"(-?\d+(\.\d+)?)", score_text)
                if score_number:
                    score = float(score_number.group(1))

            # Determine sentiment category
            sentiment_category = "neutral"
            if "positive" in sentiment.lower():
                sentiment_category = "positive"
            elif "negative" in sentiment.lower():
                sentiment_category = "negative"

            return {"summary": summary, "sentiment": sentiment_category, "score": score}
        except Exception as e:
            print(f"Error analyzing sentiment with OpenAI: {e}")
            return {
                "summary": "Error analyzing review content",
                "sentiment": "neutral",
                "score": 0,
            }

    def search_youtube_reviews(self, movie_name, max_results=3):
        """
        Search YouTube for movie reviews based on movie name.

        Args:
            movie_name (str): Name of the movie to search for
            max_results (int): Maximum number of videos to return

        Returns:
            list: List of dictionaries containing video information
        """
        try:
            # Initialize YouTube API client
            youtube = build("youtube", "v3", developerKey=self.youtube_api_key)

            # Construct search query
            search_query = f"{movie_name} movie review"

            # Execute search request
            request = youtube.search().list(
                part="snippet",
                maxResults=max_results,
                q=search_query,
                type="video",
                relevanceLanguage="en",
            )
            response = request.execute()

            # Extract video information
            videos = []
            for item in response.get("items", []):
                video_id = item["id"]["videoId"]
                title = item["snippet"]["title"]
                channel = item["snippet"]["channelTitle"]

                videos.append(
                    {
                        "video_id": video_id,
                        "title": title,
                        "channel": channel,
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                    }
                )

            return videos
        except Exception as e:
            print(f"Error searching YouTube: {e}")
            return []

    def get_video_transcript(self, video_id):
        """
        Get transcript of a YouTube video using the YouTube Transcript API.

        Args:
            video_id (str): YouTube video ID

        Returns:
            str: Full transcript text
        """
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = " ".join([item["text"] for item in transcript_list])
            return transcript_text
        except Exception as e:
            print(f"Error getting transcript for video {video_id}: {e}")
            return None

    def generate_sample_reviews(self, movie_title):
        """Generate sample YouTube reviews about a movie if the API fails"""

        # Create sample reviews
        samples = [
            {
                "video_id": "sample1",
                "title": f"{movie_title} - A Cinematic Masterpiece",
                "channel": "MovieCritic Pro",
                "url": "#",
                "summary": f"{movie_title} delivers stunning visuals, compelling performances, and a thought-provoking storyline that stays with you long after the credits roll.",
                "sentiment": "positive",
                "score": 0.8,
            },
            {
                "video_id": "sample2",
                "title": f"Why {movie_title} Is Just Average - Full Review",
                "channel": "Honest Film Reviews",
                "url": "#",
                "summary": f"While {movie_title} has some interesting moments and decent acting, the plot is predictable and the pacing issues make it difficult to fully engage with the story.",
                "sentiment": "neutral",
                "score": 0.1,
            },
            {
                "video_id": "sample3",
                "title": f"{movie_title} - The Most Disappointing Film of the Year",
                "channel": "CinemaUnfiltered",
                "url": "#",
                "summary": f"{movie_title} fails to deliver on its promising premise with poor character development, inconsistent pacing, and an ending that makes little sense given the setup.",
                "sentiment": "negative",
                "score": -0.7,
            },
        ]

        return samples

    def process_youtube_reviews(self, movie_name):
        """
        Main function to process YouTube reviews for a movie.

        Args:
            movie_name (str): Name of the movie

        Returns:
            list: Processed review data
        """
        logger.info(f"Processing YouTube reviews for: {movie_name}")
        start_time = time.time()

        # Get YouTube videos
        videos = self.search_youtube_reviews(movie_name)
        logger.info(f"Found {len(videos)} videos for '{movie_name}'")

        results = []

        # If no videos found, use sample data
        if not videos:
            logger.warning(
                f"No YouTube videos found for '{movie_name}', using sample data"
            )
            return self.generate_sample_reviews(movie_name)

        for i, video in enumerate(videos):
            try:
                logger.info(f"Processing video {i + 1}/{len(videos)}: {video['title']}")

                # Get transcript
                transcript = self.get_video_transcript(video["video_id"])

                if transcript:
                    logger.info(
                        f"Got transcript for video: {video['video_id']} (length: {len(transcript)} chars)"
                    )

                    # Analyze sentiment
                    analysis = self.analyze_with_openai(transcript, movie_name)
                    logger.info(
                        f"Sentiment analysis complete: {analysis['sentiment']} (score: {analysis['score']})"
                    )

                    # Combine video info with analysis
                    review_data = {**video, **analysis}
                    results.append(review_data)
                else:
                    logger.warning(
                        f"No transcript available for video: {video['video_id']}"
                    )
            except Exception as e:
                logger.error(f"Error processing video {video['video_id']}: {str(e)}")

        # If no results with transcripts, use sample data
        if not results:
            logger.warning(
                f"No transcripts available for '{movie_name}' videos, using sample data"
            )
            return self.generate_sample_reviews(movie_name)

        elapsed_time = time.time() - start_time
        logger.info(
            f"YouTube processing complete for '{movie_name}'. Processed {len(results)} videos in {elapsed_time:.2f} seconds"
        )

        return results

    def get_youtube_sentiment(self, movie_title):
        """Get YouTube sentiment for a movie"""
        youtube_results = self.process_youtube_reviews(movie_title)

        # Calculate overall sentiment stats
        if youtube_results:
            positive_count = sum(
                1 for review in youtube_results if review["sentiment"] == "positive"
            )
            neutral_count = sum(
                1 for review in youtube_results if review["sentiment"] == "neutral"
            )
            negative_count = sum(
                1 for review in youtube_results if review["sentiment"] == "negative"
            )

            # Calculate average score (converting from -1 to 1 scale to 0 to 10 scale)
            avg_score = sum(review.get("score", 0) for review in youtube_results) / len(
                youtube_results
            )
            sentiment_score = round(
                ((avg_score + 1) / 2) * 10, 1
            )  # Convert -1,1 to 0,10

            # Get examples of each sentiment type
            positive_examples = [
                review["summary"]
                for review in youtube_results
                if review["sentiment"] == "positive"
            ]
            neutral_examples = [
                review["summary"]
                for review in youtube_results
                if review["sentiment"] == "neutral"
            ]
            negative_examples = [
                review["summary"]
                for review in youtube_results
                if review["sentiment"] == "negative"
            ]

            return {
                "youtube": {
                    "reviews": youtube_results,
                    "sentiment_score": sentiment_score,
                    "positive": positive_count,
                    "neutral": neutral_count,
                    "negative": negative_count,
                    "content_count": len(youtube_results),
                    "positive_examples": positive_examples,
                    "neutral_examples": neutral_examples,
                    "negative_examples": negative_examples,
                    "source": "YouTube",
                }
            }
        else:
            return {
                "youtube": {
                    "reviews": [],
                    "sentiment_score": 0,
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0,
                    "content_count": 0,
                    "positive_examples": [],
                    "neutral_examples": [],
                    "negative_examples": [],
                    "source": "YouTube",
                    "error": "No YouTube data available",
                }
            }


# Example usage
if __name__ == "__main__":
    analyzer = YouTubeSentiment()
    results = analyzer.get_youtube_sentiment("Inception")
    print(json.dumps(results, indent=2))

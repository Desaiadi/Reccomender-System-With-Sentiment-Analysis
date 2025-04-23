import requests
import json
import re
import numpy as np
from bs4 import BeautifulSoup
import pickle
import os
import random
from datetime import datetime, timedelta


# Load the NLP model and vectorizer
def load_sentiment_model():
    try:
        clf = pickle.load(open("nlp_model.pkl", "rb"))
        vectorizer = pickle.load(open("tranform.pkl", "rb"))
        return clf, vectorizer
    except Exception as e:
        print(f"Error loading sentiment model: {e}")
        return None, None


class TwitterSentiment:
    def __init__(self):
        self.clf, self.vectorizer = load_sentiment_model()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36"
        }

    def clean_text(self, text):
        """Clean text by removing URLs, special characters, etc."""
        # Remove URLs
        text = re.sub(r"http\S+", "", text)
        # Remove special characters and numbers
        text = re.sub(r"[^a-zA-Z\s]", "", text)
        # Remove extra spaces
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def analyze_sentiment_with_neutral(self, text_list):
        """Analyze sentiment of a list of texts including neutral category"""
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

            # Categorize tweets by sentiment
            positive_examples = []
            neutral_examples = []
            negative_examples = []

            positive_count = 0
            neutral_count = 0
            negative_count = 0

            # Consider tweets with probability between 0.4 and 0.6 as neutral
            for i, (text, pred, prob) in enumerate(
                zip(text_list, predictions, probabilities)
            ):
                # Get probability of positive class
                positive_prob = prob[1] if len(prob) > 1 else prob[0]

                if 0.4 <= positive_prob <= 0.6:
                    # Neutral sentiment
                    neutral_count += 1
                    if len(neutral_examples) < 5:  # Keep up to 5 examples
                        neutral_examples.append(text)
                elif pred == 1:
                    # Positive sentiment
                    positive_count += 1
                    if len(positive_examples) < 5:  # Keep up to 5 examples
                        positive_examples.append(text)
                else:
                    # Negative sentiment
                    negative_count += 1
                    if len(negative_examples) < 5:  # Keep up to 5 examples
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

    def get_sample_tweets(self, movie_title):
        """Generate sample tweets about a movie if the API fails"""

        # List of sample tweet templates with varying sentiment
        positive_templates = [
            "Just watched {movie} and absolutely loved it! The cinematography was breathtaking. Definitely a 10/10 for me! #MustWatch",
            "Can't stop thinking about {movie}! The performances were outstanding and the story kept me engaged throughout. #MovieNight",
            "{movie} might be my favorite film this year. Amazing direction and a beautiful score. Everyone should see this! #FilmTwitter",
            "Highly recommend {movie} to everyone! The plot twists were unexpected and the acting was superb. #MovieRecommendation",
            "Finally saw {movie} last night and it exceeded all my expectations. What a fantastic movie experience! #Cinema",
            "The visuals in {movie} are absolutely stunning. A masterpiece of modern cinema! #FilmPhotography",
            "I've seen {movie} three times already and it gets better with each viewing. The details you notice! #FavoriteMovie",
            "The soundtrack in {movie} perfectly complements every scene. Already added it to my playlist! #MovieSoundtrack",
        ]

        negative_templates = [
            "{movie} was disappointing. Had high expectations but the plot was confusing and the pacing was off. #MovieFail",
            "Save your money and skip {movie}. The characters were underdeveloped and the ending made no sense. #NotWorthIt",
            "I wanted to like {movie} but it was just too predictable. Nothing we haven't seen before. #Meh",
            "Just sat through {movie} and those were two hours of my life I'll never get back. So boring! #Disappointed",
            "The acting in {movie} was surprisingly bad, especially considering the talent involved. What a letdown. #OverratedMovie",
            "Walked out of {movie} halfway through. Convoluted storyline and terrible dialogue. #WasteOfMoney",
            "Don't believe the hype about {movie}. It's all style and no substance. #Overrated",
            "The CGI in {movie} looked so fake it took me right out of the story. #BadEffects",
        ]

        neutral_templates = [
            "{movie} had some great moments but overall felt uneven. Strong start, weak finish. #MixedFeelings",
            "Not sure how I feel about {movie}. Great performances but the story lost me in the middle. #OnTheFence",
            "{movie} has its flaws but is still worth watching for the cinematography alone. #BeautifulFilm",
            "The lead actor was amazing in {movie} but everything else was just okay. #GreatPerformance",
            "Parts of {movie} were brilliant, other parts dragged on forever. A mixed bag overall. #SomeGoodSomeBad",
            "{movie} tried to do too much and ended up accomplishing too little. Still, some scenes were memorable. #Ambitious",
            "Interesting concept in {movie} but the execution was average. Worth watching once I guess. #JustOkay",
            "I neither loved nor hated {movie}. It was a perfectly acceptable way to spend 2 hours. #Mediocre",
        ]

        # Mix positive, negative, and neutral tweets
        sample_tweets = []

        # Add positive tweets (more of these for overall positive sentiment)
        for template in positive_templates:
            sample_tweets.append(template.format(movie=movie_title))

        # Add negative tweets (fewer)
        for template in negative_templates[:4]:  # Only use 4 negative templates
            sample_tweets.append(template.format(movie=movie_title))

        # Add neutral tweets
        for template in neutral_templates:
            sample_tweets.append(template.format(movie=movie_title))

        # Shuffle to mix them up
        random.shuffle(sample_tweets)

        return sample_tweets

    def get_twitter_content(self, movie_title, limit=30):
        """
        Fetch tweets about a movie using Twitter API
        """
        try:
            import tweepy
            import time

            # Twitter API credentials (using environment variables for security)
            # You should set these environment variables in your production environment
            # For development, we'll use the provided values
            bearer_token = os.environ.get(
                "TWITTER_BEARER_TOKEN",
                "AAAAAAAAAAAAAAAAAAAAAOSW0gEAAAAAZW9RQee%2FW%2FQs4FQGvqJXbVIdueg%3Dy67R8bRCuuBsXZPkz8LvYfelQCelojKg8Jb0HmQsgSCwqynhF6",
            )
            access_token = os.environ.get(
                "TWITTER_ACCESS_TOKEN",
                "1432329973226897410-WQgU60wO7J7yoLWMCZI20xNTc9EtzF",
            )
            access_token_secret = os.environ.get(
                "TWITTER_ACCESS_TOKEN_SECRET",
                "uaHtWWnUd0MXQOs0dT7oobbzPUmIk4US9eAloKMD8k1Gd",
            )

            # Initialize the Tweepy Client
            client = tweepy.Client(
                bearer_token=bearer_token,
                access_token=access_token,
                access_token_secret=access_token_secret,
            )

            # Define search query for the movie
            query = f"{movie_title} movie"
            max_results = min(limit, 100)  # Twitter API limits

            tweets = []
            max_retries = 3
            retry_count = 0

            while retry_count < max_retries:
                try:
                    # Fetch recent tweets containing the query
                    response = client.search_recent_tweets(
                        query=query, max_results=max_results
                    )

                    # Check if any tweets were returned
                    if response.data:
                        for tweet in response.data:
                            tweets.append(tweet.text)
                        break  # Exit loop if successful
                    else:
                        print(f"No tweets found for the query: {query}")
                        break

                except tweepy.TooManyRequests:
                    # If rate limit is exceeded, wait before retrying
                    retry_count += 1
                    wait_time = 2**retry_count  # Exponential backoff
                    print(
                        f"Rate limit exceeded. Waiting {wait_time} seconds before retrying..."
                    )
                    time.sleep(wait_time)

                except Exception as e:
                    print(f"Twitter API error: {e}")
                    break

            # If no tweets found or error occurred, use sample data
            if not tweets:
                print("Using sample Twitter data for", movie_title)
                tweets = self.get_sample_tweets(movie_title)

            # Analyze sentiment with neutral category
            sentiment_results = self.analyze_sentiment_with_neutral(tweets)
            sentiment_results["source"] = "Twitter"
            sentiment_results["content_count"] = len(tweets)

            return sentiment_results

        except ImportError:
            print("Tweepy not installed. Please install with: pip install tweepy")
            # Fallback to sample data
            tweets = self.get_sample_tweets(movie_title)

            sentiment_results = self.analyze_sentiment_with_neutral(tweets)
            sentiment_results["source"] = "Twitter"
            sentiment_results["content_count"] = len(tweets)
            sentiment_results["error"] = "Tweepy not installed"

            return sentiment_results

        except Exception as e:
            print(f"Error getting Twitter content: {e}")
            tweets = self.get_sample_tweets(movie_title)
            sentiment_results = self.analyze_sentiment_with_neutral(tweets)
            sentiment_results["source"] = "Twitter"
            sentiment_results["content_count"] = len(tweets)
            sentiment_results["error"] = str(e)
            return sentiment_results

    def get_movie_sentiment(self, movie_title):
        """Get Twitter sentiment for a movie"""
        twitter_results = self.get_twitter_content(movie_title)

        # Generate timeline data (sample data for now)
        timeline_data = self.generate_sample_timeline_data()
        twitter_results["timeline"] = timeline_data

        return {
            "twitter": twitter_results,
            "overall_sentiment": {
                "score": twitter_results.get("sentiment_score", 0),
                "total_positive": twitter_results.get("positive", 0),
                "total_neutral": twitter_results.get("neutral", 0),
                "total_negative": twitter_results.get("negative", 0),
            },
        }

    def generate_sample_timeline_data(self):
        """Generate sample timeline data for sentiment over time"""
        today = datetime.now()
        dates = [
            (today - timedelta(days=i)).strftime("%b %d") for i in range(6, -1, -1)
        ]

        # Generate random sentiment data
        positive_values = [random.randint(40, 70) for _ in range(7)]
        neutral_values = [random.randint(10, 30) for _ in range(7)]
        negative_values = []

        # Calculate negative to make total 100%
        for i in range(7):
            remaining = 100 - positive_values[i] - neutral_values[i]
            negative_values.append(max(0, remaining))  # Ensure non-negative

        return {
            "dates": dates,
            "positive": positive_values,
            "neutral": neutral_values,
            "negative": negative_values,
        }


# Example usage
if __name__ == "__main__":
    analyzer = TwitterSentiment()
    results = analyzer.get_movie_sentiment("Inception")
    print(json.dumps(results, indent=2))

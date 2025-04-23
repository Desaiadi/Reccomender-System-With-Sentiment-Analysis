
## Project Overview

In the current landscape of movie recommendation platforms, most systems recommend films based purely on content similarity without considering audience reception. This can lead to recommending sequels or similar movies that are poorly received, or overlooking cult classics that gained appreciation over time. Our system addresses these limitations by integrating multi-platform sentiment analysis to create a time-aware, reception-sensitive recommendation engine that rewards quality regardless of release timing.

## Case Studies

### Case Study 1: Cult Classic Recognition
**Movie: "The Shawshank Redemption" (1994)**

Initial reception: Moderate box office performance and mixed initial reviews
Current status: Consistently ranked among the greatest films of all time

Our system automatically detected the growing positive sentiment over time, with steadily improving social media sentiment scores across platforms. Despite being released decades ago, the system ranks it highly in recommendations for similar movies, demonstrating the temporal fairness of our algorithm.

### Case Study 2: Sequel Quality Differentiation
**Franchise: "The Matrix" series**

Content similarity between the original "The Matrix" (1999) and its sequels is extremely high (0.92+ cosine similarity). However, our sentiment analysis shows:
- "The Matrix" (1999): 0.89 aggregate sentiment score
- "The Matrix Reloaded" (2003): 0.64 aggregate sentiment score
- "The Matrix Revolutions" (2003): 0.51 aggregate sentiment score

When a user enjoys "The Matrix," our system recommends other high-quality sci-fi films like "Inception" ahead of the lower-rated direct sequels, despite their lower content similarity but higher sentiment scores.

### Case Study 3: Emerging Quality Detection
**Movie: "Everything Everywhere All at Once" (2022)**

Our system detected rapidly growing positive sentiment across platforms shortly after release, with particularly strong signals from film enthusiast communities on Reddit and YouTube critic reviews. This allowed the system to confidently recommend this film to users who enjoyed similar but more established titles, helping users discover this new quality film early in its lifecycle.## Smart Recommendation Ranking

Our system implements a sophisticated ranking algorithm that goes beyond simple content similarity:

### Sentiment-Adjusted Similarity Score

The core of our recommendation engine is the Sentiment-Adjusted Similarity Score (SASS):

```
SASS = α × ContentSimilarity + β × SocialSentiment + γ × TemporalTrend
```

Where:
- **ContentSimilarity**: Cosine similarity between movie feature vectors
- **SocialSentiment**: Weighted aggregate of sentiment across platforms
- **TemporalTrend**: Measure of how sentiment has changed over time
- **α, β, γ**: Configurable weights to balance these factors

### Multi-platform Sentiment Integration

Social sentiment is calculated as:

```
SocialSentiment = w₁×TwitterScore + w₂×YouTubeScore + w₃×RedditScore + w₄×IMDBScore
```

Platform weights (w₁, w₂, w₃, w₄) are determined based on:
- Data volume and reliability
- Community expertise
- Correlation with box office and user satisfaction

### Temporal Analysis and Fairness Mechanisms

Our system implements special handling for:

1. **Sequel Penalization**: Poor-quality sequels to great movies receive adjusted scores to prevent recommendation based solely on franchise association
   
2. **Cult Classic Promotion**: Films with initially mixed reception but growing positive sentiment over time are boosted in recommendations

3. **Recency Adjustment**: Recent releases with limited data are carefully evaluated to prevent bias against new content

4. **Franchise Fatigue Detection**: Declining sentiment across sequential entries in a series is detected and factored into recommendations

This balanced approach ensures that truly great films rise to the top of recommendations regardless of release timing, franchise association, or initial reception.# Movie Recommendation System with Social Media Analytics

This project is a comprehensive movie recommendation system that combines content-based filtering with real-time social media analytics to provide intelligent movie recommendations based on both content similarity and current audience reception across multiple platforms.

## Features

- **Content-based Movie Recommendations**: Find movies with similar themes, actors, directors, and genres
- **Comprehensive Social Media Analytics**: Real-time analysis of Twitter trends, YouTube comments, Reddit discussions, and IMDB reviews
- **Sentiment-Weighted Ranking Algorithm**: Innovative scoring system that factors in reception across platforms to rank recommendations
- **Temporal Sentiment Analysis**: Track changes in reception over time to identify emerging cult classics and declining franchises
- **Sequel Quality Detection**: Automatically detect and downrank poorly-received sequels regardless of content similarity
- **Quality-Focused Discovery**: Surfacing underappreciated films that match user interests but may have been overlooked
- **Tweet Visualization**: Display and analyze recent tweets about the movie with sentiment indicators
- **YouTube Review Summaries**: Extract and analyze key points from popular YouTube video reviews
- **Social Trend Detection**: Identify memes, viral moments, and cultural impact of movies across platforms
- **Unified Information Platform**: Access all movie details, recommendations, and social analytics in one place
- **Interactive Web Interface**: User-friendly interface with autocomplete search and dynamic social content
- **Multi-platform Sentiment Aggregation**: Combined sentiment scores from all social sources with weighted importance

## Technical Architecture

### Backend (Flask)

- **Movie Recommendation Engine**: Uses cosine similarity to identify similar movies
- **Similarity Matrix Computation**: Pre-computes similarity scores for optimal performance
- **Multi-platform Data Aggregation**: Collects and processes data from Twitter, YouTube, Reddit, and IMDB
- **Twitter API Integration**: Real-time retrieval and analysis of tweets about movies
- **YouTube Comment Extraction**: Processes user comments and video descriptions from movie reviews
- **Reddit Discussion Analysis**: Monitors and analyzes movie-related subreddits for audience reactions
- **Sentiment Analysis Model**: Classifies content from all sources as positive, negative, or neutral
- **Trend Detection Algorithm**: Identifies emerging patterns and viral content

### Frontend

- **Home Page**: Provides search functionality with autocomplete
- **Recommendation Page**: Displays movie details, cast information, reviews with sentiment analysis, and similar movie recommendations
- **JavaScript Functions**: Handle user interactions and API calls

### Machine Learning Components

- **TF-IDF Vectorization**: Converts text to numerical features for similarity calculation and sentiment analysis
- **Multinomial Naive Bayes Classifier**: Trained on labeled movie reviews with 98.8% accuracy
- **Pre-computation Strategy**: Efficient similarity matrix calculation for 6,000+ movies
- **Platform-specific Sentiment Models**: Tailored classifiers for Twitter, YouTube, Reddit, and IMDB content
- **Social Trend Detection**: Machine learning models to identify emerging topics and viral content
- **Temporal Analysis**: Track sentiment changes over time for trending movies
- **Entity Recognition**: Identify actors, characters, and movie elements being discussed
- **Automatic YouTube Summary Generation**: NLP models to extract key points from video transcripts/descriptions

## Installation and Setup

### Prerequisites

- Python 3.8+
- Flask
- scikit-learn
- NLTK
- BeautifulSoup4
- pandas
- numpy
- requests
- tweepy (Twitter API)
- praw (Reddit API)
- google-api-python-client (YouTube API)
- transformers (for advanced NLP tasks)
- plotly/matplotlib (for visualization)
- Redis (for caching)
- Kafka (for real-time data processing)

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/Desaiadi/Reccomender-System-With-Sentiment-Analysis.git
   cd movie-recommendation-system
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Download NLTK stopwords:
   ```python
   import nltk
   nltk.download('stopwords')
   ```

4. Run the Flask application:
   ```
   python main.py
   ```

5. Access the application at `http://localhost:5000`

## Data Sources

- **Movie Dataset**: main_data.csv containing movie information and combined features
- **TMDB API**: Provides movie metadata (posters, cast details, ratings)
- **Twitter API**: Real-time tweets and trending topics about movies
- **YouTube API**: Video content, comments, and metadata from movie reviews and trailers
- **Reddit API**: Discussions from movie-related subreddits
- **IMDB Website**: User reviews (scraped in real-time)
- **Sentiment Analysis Datasets**: Multi-platform labeled data for training platform-specific models
  - 7,000 labeled movie reviews for general sentiment model
  - Platform-specific datasets for Twitter, YouTube, and Reddit content

## How It Works

### Content-Based Recommendation Process

1. **Feature Extraction**: Movie attributes are combined into a single text representation
2. **Vectorization**: CountVectorizer transforms text into numerical vectors
3. **Similarity Calculation**: Cosine similarity measures relationship between movies
4. **Pre-computation**: Similarity matrix is calculated once and stored for efficiency

### Social Media Analytics Pipeline

1. **Multi-source Data Collection**:
   - Twitter API streams for recent tweets
   - YouTube API for video content and comments
   - Reddit API for relevant subreddit discussions
   - IMDB web scraping for reviews

2. **Platform-specific Preprocessing**:
   - Twitter: Hashtag analysis, mention extraction, retweet handling
   - YouTube: Comment extraction, video description analysis
   - Reddit: Subreddit categorization, comment thread analysis
   - IMDB: Review formatting, rating correlation

3. **Unified Text Processing**:
   - Converting to lowercase, removing stopwords, handling ASCII
   - Platform-specific tokenization and normalization
   - Emoji and hashtag semantic analysis

4. **Advanced Feature Extraction**:
   - TF-IDF vectorization
   - N-gram analysis
   - Entity recognition (actors, directors, movie elements)
   - Temporal feature extraction (recency, trend velocity)

5. **Multi-model Sentiment Classification**:
   - Platform-tailored Naive Bayes models
   - Specialized classifiers for short-form content (tweets)
   - Context-aware sentiment detection

6. **Trend and Meme Detection**:
   - Clustering algorithms to identify emerging topics
   - Spike detection for viral content
   - Cross-platform correlation analysis

7. **Aggregation and Weighting**:
   - Platform importance weighting
   - Recency-based scoring
   - Influence-adjusted sentiment (follower count, likes)
   - Unified sentiment score calculation

8. **Recommendation Integration**:
   - Quality-based reranking of content-similar movies
   - Franchise sentiment comparison for sequels/prequels
   - Historical reception trajectory analysis
   - Promotion of underappreciated quality matches
   - Demotion of poorly-received similar titles

### User Flow

1. User searches for a movie with autocomplete assistance
2. System returns comprehensive movie dashboard:
   - Movie details, poster, and metadata
   - Cast information with detailed profiles
   - Content-similar movie recommendations
   - Social media sentiment overview with platform breakdown
   - Recent tweets displayed with sentiment indicators
   - YouTube review summaries with key points extracted
   - Reddit discussion highlights
   - Trending topics and memes related to the movie
   - Temporal sentiment graph showing reception over time
3. User can filter social content by platform, sentiment, or recency
4. User can explore recommended movies, each with its own social analysis
5. Real-time updates refresh social content as new data becomes available

## Future Enhancements

- **Hybrid Recommendation System**: Incorporate collaborative filtering alongside content-based and social-informed recommendations
- **Advanced NLP Models**: Integrate transformer-based models for more nuanced sentiment understanding
- **Video Content Analysis**: Direct analysis of YouTube video content through audio transcription and visual cues
- **User Personalization**: Custom recommendations based on user preferences and social media activity
- **Multimodal Analysis**: Incorporate image and video understanding of memes and visual content
- **Geographic Sentiment Mapping**: Track regional differences in movie reception
- **Predictive Analytics**: Forecast box office performance based on social signals
- **Cross-language Support**: Analyze international social media content
- **Voice Interface**: Allow users to query the system through voice commands
- **Mobile Application**: Develop dedicated mobile app with push notifications for trending movies

## Contributors

- Your Name - [desaiadiofficial@gmail.com](mailto:your.email@example.com)

## License

This project is licensed under the MIT License - see the LICENSE file for details.



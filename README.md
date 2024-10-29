# End-To-End Movie reccomender with Sentiment Analysis

This project provides a comprehensive, integrated solution that combines a movie recommendation engine, information retrieval system, and sentiment analysis capabilities, all in one application.

Tech Stack : Python, Flask, JavaScript, HTML, CSS, TMDB API, IMDb, BeautifulSoup, Pandas, Scikit-Learn, Cosine Similarity, Git, GitHub, Git LFS, Naive Bayes.

The details of the movies(title, genre, runtime, rating, poster, etc) are fetched using an API by TMDB, 
Fetching - Title, Genre, Runtime, Rating Movie Poster : TMDB API KEY (https://www.themoviedb.org/documentation/api)
Revies Are Scrapped from : IMDB site using `beautifulsoup4` (using the IMDB id of the movie in the API)

Auto suggetion is enabled, however if not suggested you should move ahead and press enter to see the details.

## Project Structure and Key Components
### Main Project Files

  main.py: Likely the main application file where the Flask server is set up, handling routes, and initiating the recommendation and sentiment analysis functions.
  README.md: Contains project description, setup instructions, and usage details.
  requirements.txt: Lists required Python libraries, allowing users to set up the environment with pip install -r requirements.txt.
  Procfile: Used for deployment on platforms like Heroku, defining the process types.

### Datasets

   datasets/ folder: Contains various CSV files (like data.csv, movie_metadata.csv, and main_data.csv) that store movie details and sentiment data needed for training and recommendations.
   reviews.txt: Likely holds textual reviews for sentiment analysis.
     
### Models and Transformations

   nlp_model.pkl and tranform.pkl: These files probably store the serialized Naive Bayes sentiment analysis model and the preprocessing transformations needed for text data.
     
### Jupyter Notebooks

   Files in .ipynb_checkpoints/ (e.g., preprocessing.ipynb and sentiment.ipynb) seem to be Jupyter notebooks that contain exploratory data analysis, data cleaning, or model training details.
     
### Static Files

   JavaScript: autocomplete.js and recommend.js handle front-end functionality for recommendations and search suggestions.
   Images: image.jpg, krish-naik.PNG, and loader.gif are used for UI visuals.
   CSS: style.css defines the styling for the application.
### Templates

   HTML: home.html and recommend.html define the structure and layout of the web pages served by Flask.
          
## Summary of Key Features
**Movie Recommendation:** Uses the TMDB API to fetch movie details.
**Sentiment Analysis:** Implements a Naive Bayes model trained on movie reviews to analyze user sentiment.
**Autocomplete Functionality:** Assists users in finding movie titles quickly.
**Data Sources:** Combines local datasets and web-scraped reviews for a robust recommendation engine.

## Using this project

1. Clone or download this repository to your local machine.
2. Download "credits.csv" and "movies_metadata.csv" from "https://www.kaggle.com/rounakbanik/the-movies-dataset"
3. Install all the libraries mentioned in the [requirements.txt] file with the command `pip install -r requirements.txt`
     - If you still find some errors like - Something Did not found - try installing manually (e.g. pip install numpy)
4. Get your API key from https://www.themoviedb.org/. 
      Getting API KEY -
                        1) Create Account on TMDB (https://www.themoviedb.org/)
                        2) on Navigation Bar go to --> more --> API
                        3) Choose Developer
                        4) Fill all the details to request the key (Note* you can fill NA in "URL" field)
                        5) After completing API Key should appear as a combination of numbers and letters 
   
3. Replace YOUR_API_KEY in **both** the places (line no. 15 and 29) of `static/recommend.js` file and hit save.
4. Open your terminal/command prompt from your project directory and run the file `main.py` by executing the command `python main.py`.
5. Go to your browser and type `http://127.0.0.1:5000/` in the address bar.
6. Enjoy the product

## Architecture

![Adi Architecture](https://github.com/Desaiadi/Reccomender-System-With-Sentiment-Analysis/blob/main/Architecture/Recomendation%20SystemWith%20Sentiment%20Analysis.jpg)

## Similarity Score : 

   How does it decide which item is most similar to the item user likes? Here come the similarity scores.
   
   It is a numerical value ranges between zero to one which helps to determine how much two items are similar to each other on a scale of zero to one. This similarity score is obtained measuring the similarity between the text details of both of the items. So, similarity score is the measure of similarity between given text details of two items. This can be done by cosine-similarity.
   
## Cosine Similarity
  Cosine similarity is a metric used to measure how similar the documents are irrespective of their size. Mathematically, it measures the cosine of the angle between two vectors projected in a multi-dimensional space. The cosine similarity is advantageous because even if the two similar documents are far apart by the Euclidean distance (due to the size of the document), chances are they may still be oriented closer together. The smaller the angle, higher the cosine similarity.
  
### Sources of the datasets 

1. [IMDB 5000 Movie Dataset](https://www.kaggle.com/carolzhangdc/imdb-5000-movie-dataset)
2. [The Movies Dataset](https://www.kaggle.com/rounakbanik/the-movies-dataset)
3. [List of movies in 2018](https://en.wikipedia.org/wiki/List_of_American_films_of_2018)
4. [List of movies in 2019](https://en.wikipedia.org/wiki/List_of_American_films_of_2019)
5. [List of movies in 2020](https://en.wikipedia.org/wiki/List_of_American_films_of_2020)

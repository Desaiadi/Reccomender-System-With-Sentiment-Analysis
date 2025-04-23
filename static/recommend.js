
$(function() {
  // Button will be disabled until we type anything inside the input field
  const source = document.getElementById('autoComplete');
  const inputHandler = function(e) {
    if(e.target.value==""){
      $('.movie-button').attr('disabled', true);
    }
    else{
      $('.movie-button').attr('disabled', false);
    }
  }
  source.addEventListener('input', inputHandler);

  $('.movie-button').on('click',function(){
    var my_api_key = 'enter_your_tmdb_api_key';
    var title = $('.movie').val();
    if (title=="") {
      $('.results').css('display','none');
      $('.fail').css('display','block');
    }
    else{
      load_details(my_api_key,title);
    }
  });
});

// will be invoked when clicking on the recommended movies
function recommendcard(e){
  var my_api_key = 'enter_your_tmdb_api_key';
  var title = e.getAttribute('title'); 
  load_details(my_api_key,title);
}

// get the basic details of the movie from the API (based on the name of the movie)
function load_details(my_api_key,title){
  $.ajax({
    type: 'GET',
    url:'https://api.themoviedb.org/3/search/movie?api_key='+my_api_key+'&query='+title,

    success: function(movie){
      if(movie.results.length<1){
        $('.fail').css('display','block');
        $('.results').css('display','none');
        $("#loader").delay(500).fadeOut();
      }
      else{
        $("#loader").fadeIn();
        $('.fail').css('display','none');
        $('.results').delay(1000).css('display','block');
        var movie_id = movie.results[0].id;
        var movie_title = movie.results[0].original_title;
        movie_recs(movie_title,movie_id,my_api_key);
      }
    },
    error: function(){
      alert('Invalid Request');
      $("#loader").delay(500).fadeOut();
    },
  });
}

// passing the movie name to get the similar movies from python's flask
function movie_recs(movie_title,movie_id,my_api_key){
  $.ajax({
    type:'POST',
    url:"/similarity",
    data:{'name':movie_title},
    success: function(recs){
      if(recs=="Sorry! The movie you requested is not in our database. Please check the spelling or try with some other movies"){
        $('.fail').css('display','block');
        $('.results').css('display','none');
        $("#loader").delay(500).fadeOut();
      }
      else {
        $('.fail').css('display','none');
        $('.results').css('display','block');
        var movie_arr = recs.split('---');
        var arr = [];
        for(const movie in movie_arr){
          arr.push(movie_arr[movie]);
        }
        get_movie_details(movie_id,my_api_key,arr,movie_title);
      }
    },
    error: function(){
      alert("error recs");
      $("#loader").delay(500).fadeOut();
    },
  }); 
}

// get all the details of the movie using the movie id.
function get_movie_details(movie_id,my_api_key,arr,movie_title) {
  $.ajax({
    type:'GET',
    url:'https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+my_api_key,
    success: function(movie_details){
      show_details(movie_details,arr,movie_title,my_api_key,movie_id);
    },
    error: function(){
      alert("API Error!");
      $("#loader").delay(500).fadeOut();
    },
  });
}

// passing all the details to python's flask for displaying and scraping the movie reviews using imdb id
function show_details(movie_details,arr,movie_title,my_api_key,movie_id){
  var imdb_id = movie_details.imdb_id;
  var poster = 'https://image.tmdb.org/t/p/original'+movie_details.poster_path;
  var overview = movie_details.overview;
  var genres = movie_details.genres;
  var rating = movie_details.vote_average;
  var vote_count = movie_details.vote_count;
  var release_date = new Date(movie_details.release_date);
  var runtime = parseInt(movie_details.runtime);
  var status = movie_details.status;
  var genre_list = []
  for (var genre in genres){
    genre_list.push(genres[genre].name);
  }
  var my_genre = genre_list.join(", ");
  if(runtime%60==0){
    runtime = Math.floor(runtime/60)+" hour(s)"
  }
  else {
    runtime = Math.floor(runtime/60)+" hour(s) "+(runtime%60)+" min(s)"
  }
  arr_poster = get_movie_posters(arr,my_api_key);
  
  movie_cast = get_movie_cast(movie_id,my_api_key);
  
  ind_cast = get_individual_cast(movie_cast,my_api_key);
  
  details = {
    'title':movie_title,
      'cast_ids':JSON.stringify(movie_cast.cast_ids),
      'cast_names':JSON.stringify(movie_cast.cast_names),
      'cast_chars':JSON.stringify(movie_cast.cast_chars),
      'cast_profiles':JSON.stringify(movie_cast.cast_profiles),
      'cast_bdays':JSON.stringify(ind_cast.cast_bdays),
      'cast_bios':JSON.stringify(ind_cast.cast_bios),
      'cast_places':JSON.stringify(ind_cast.cast_places),
      'imdb_id':imdb_id,
      'poster':poster,
      'genres':my_genre,
      'overview':overview,
      'rating':rating,
      'vote_count':vote_count.toLocaleString(),
      'release_date':release_date.toDateString().split(' ').slice(1).join(' '),
      'runtime':runtime,
      'status':status,
      'rec_movies':JSON.stringify(arr),
      'rec_posters':JSON.stringify(arr_poster),
  }

  $.ajax({
    type:'POST',
    data:details,
    url:"/recommend",
    dataType: 'html',
    complete: function(){
      $("#loader").delay(500).fadeOut();
    },
    success: function(response) {
      $('.results').html(response);
      $('#autoComplete').val('');
      $(window).scrollTop(0);
    }
  });
}

// get the details of individual cast
function get_individual_cast(movie_cast,my_api_key) {
    cast_bdays = [];
    cast_bios = [];
    cast_places = [];
    for(var cast_id in movie_cast.cast_ids){
      $.ajax({
        type:'GET',
        url:'https://api.themoviedb.org/3/person/'+movie_cast.cast_ids[cast_id]+'?api_key='+my_api_key,
        async:false,
        success: function(cast_details){
          cast_bdays.push((new Date(cast_details.birthday)).toDateString().split(' ').slice(1).join(' '));
          cast_bios.push(cast_details.biography);
          cast_places.push(cast_details.place_of_birth);
        }
      });
    }
    return {cast_bdays:cast_bdays,cast_bios:cast_bios,cast_places:cast_places};
  }

// getting the details of the cast for the requested movie
function get_movie_cast(movie_id,my_api_key){
    cast_ids= [];
    cast_names = [];
    cast_chars = [];
    cast_profiles = [];

    top_10 = [0,1,2,3,4,5,6,7,8,9];
    $.ajax({
      type:'GET',
      url:"https://api.themoviedb.org/3/movie/"+movie_id+"/credits?api_key="+my_api_key,
      async:false,
      success: function(my_movie){
        if(my_movie.cast.length>=10){
          top_cast = [0,1,2,3,4,5,6,7,8,9];
        }
        else {
          top_cast = [0,1,2,3,4];
        }
        for(var my_cast in top_cast){
          cast_ids.push(my_movie.cast[my_cast].id)
          cast_names.push(my_movie.cast[my_cast].name);
          cast_chars.push(my_movie.cast[my_cast].character);
          cast_profiles.push("https://image.tmdb.org/t/p/original"+my_movie.cast[my_cast].profile_path);
        }
      },
      error: function(){
        alert("Invalid Request!");
        $("#loader").delay(500).fadeOut();
      }
    });

    return {cast_ids:cast_ids,cast_names:cast_names,cast_chars:cast_chars,cast_profiles:cast_profiles};
  }

// getting posters for all the recommended movies
function get_movie_posters(arr,my_api_key){
  var arr_poster_list = []
  for(var m in arr) {
    $.ajax({
      type:'GET',
      url:'https://api.themoviedb.org/3/search/movie?api_key='+my_api_key+'&query='+arr[m],
      async: false,
      success: function(m_data){
        arr_poster_list.push('https://image.tmdb.org/t/p/original'+m_data.results[0].poster_path);
      },
      error: function(){
        alert("Invalid Request!");
        $("#loader").delay(500).fadeOut();
      },
    })
  }
  return arr_poster_list;
}

// Add this function to your recommend.js file
// YouTube Reviews Analysis// Enhanced YouTube Reviews Analysis
function displayYouTubeReviews(movieName) {
  // Get the YouTube reviews container
  const youtubeContainer = document.getElementById('youtube-reviews');
  
  if (!youtubeContainer) {
    console.error('YouTube container not found in DOM');
    return;
  }
  
  // Update the loading movie title
  const loadingMovieTitle = document.getElementById('movie-title-loading');
  if (loadingMovieTitle) {
    loadingMovieTitle.textContent = movieName || 'this movie';
  }
  
  console.log(`Fetching YouTube reviews for: ${movieName}`);
  
  // Set initial loading state
  youtubeContainer.innerHTML = `
    <div class="container-fluid mt-4">
      <div class="row">
        <div class="col-md-12">
          <center>
            <h2 style="color:white" class="mb-4">YOUTUBE REVIEWS ANALYSIS</h2>
          </center>
          <div class="social-card">
            <div class="loading text-center">
              <i class="fas fa-spinner fa-spin mr-2" style="color: #FF0000; font-size: 24px;"></i>
              <span style="color:#e4e0e0">Analyzing YouTube reviews for "${movieName}"...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Fetch YouTube reviews
  fetch('/youtube_reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      movie_name: movieName
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('YouTube API response:', data);
    
    // Check if we have valid data
    if (data && data.length > 0) {
      // Calculate sentiment stats
      const sentiments = data.map(review => review.sentiment);
      const posCount = sentiments.filter(s => s === 'positive').length;
      const neuCount = sentiments.filter(s => s === 'neutral').length;
      const negCount = sentiments.filter(s => s === 'negative').length;
      
      // Calculate average sentiment score
      const avgScore = data.reduce((sum, review) => sum + (review.score || 0), 0) / data.length;
      const normalizedScore = ((avgScore + 1) / 2 * 10).toFixed(1); // Convert -1 to 1 scale to 0 to 10
      
      // Build HTML for YouTube reviews
      youtubeContainer.innerHTML = `
        <div class="container-fluid mt-4">
          <div class="row">
            <div class="col-md-12">
              <center>
                <h2 style="color:white" class="mb-4">YOUTUBE REVIEWS ANALYSIS</h2>
              </center>
              
              <div class="social-card">
                <div class="row">
                  <!-- YouTube Score Card -->
                  <div class="col-md-6">
                    <h5 style="color:white">
                      <i class="fab fa-youtube social-icon" style="color: #FF0000;"></i> YouTube Sentiment Score
                    </h5>
                    <div class="sentiment-gauge text-center">
                      <canvas id="youtubeGauge"></canvas>
                      <div class="score-display">${normalizedScore}/10</div>
                    </div>
                    <div class="text-center mt-3" style="color:white">
                      <span class="badge badge-success">${posCount} Positive</span>
                      <span class="badge badge-warning">${neuCount} Neutral</span>
                      <span class="badge badge-danger">${negCount} Negative</span>
                    </div>
                    <p class="text-center mt-3" style="color:#e4e0e0">
                      Based on analysis of ${data.length} YouTube review${data.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <!-- YouTube Sentiment Distribution Chart -->
                  <div class="col-md-6">
                    <h5 style="color:white">Sentiment Distribution</h5>
                    <canvas id="youtubeSentimentChart" style="height: 250px;"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- YouTube Review Samples Section -->
        <div class="container-fluid mt-4">
          <div class="row">
            <div class="col-md-12">
              <div class="social-card">
                <h5 style="color:white">
                  <i class="fab fa-youtube social-icon" style="color: #FF0000;"></i> YouTube Review Summaries
                  <button id="toggleYouTubeBtn" class="btn btn-sm btn-outline-light float-right" onclick="toggleYouTubeDisplay()">
                    Hide Reviews
                  </button>
                </h5>
                
                <div class="row mt-3" id="youtubeSamplesContainer">
                  <!-- Review Cards -->
                  ${data.map(review => `
                    <div class="col-md-4 mb-3">
                      <div class="youtube-review ${review.sentiment}">
                        <div class="review-header">
                          <div class="review-title">
                            <h6 style="color:white">${review.title}</h6>
                            <span class="review-channel">${review.channel}</span>
                          </div>
                        </div>
                        <div class="review-content">
                          <p style="color:#e4e0e0">${review.summary}</p>
                          <div class="sentiment-indicator ${review.sentiment}">
                            ${review.sentiment.toUpperCase()}
                          </div>
                        </div>
                        <a href="${review.url}" target="_blank" class="watch-review">Watch on YouTube</a>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Create YouTube sentiment chart
      createYouTubeSentimentChart(posCount, neuCount, negCount);
      
      // Create gauge chart for YouTube sentiment
      createGaugeChart('youtubeGauge', normalizedScore);
      
      // Update comparison chart if exists
      updateComparisonChart(normalizedScore);
      
    } else {
      // No YouTube reviews found
      youtubeContainer.innerHTML = `
        <div class="container-fluid mt-4">
          <div class="row">
            <div class="col-md-12">
              <center>
                <h2 style="color:white" class="mb-4">YOUTUBE REVIEWS ANALYSIS</h2>
              </center>
              <div class="social-card text-center py-5">
                <i class="fab fa-youtube mb-3" style="color: #FF0000; font-size: 48px;"></i>
                <h5 style="color:white">No YouTube reviews could be analyzed for this movie</h5>
                <p style="color:#e4e0e0">This could be due to unavailable transcripts or limited review content.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Error fetching YouTube reviews:', error);
    youtubeContainer.innerHTML = `
      <div class="container-fluid mt-4">
        <div class="row">
          <div class="col-md-12">
            <center>
              <h2 style="color:white" class="mb-4">YOUTUBE REVIEWS ANALYSIS</h2>
            </center>
            <div class="social-card text-center py-5">
              <i class="fas fa-exclamation-triangle mb-3" style="color: #FF0000; font-size: 48px;"></i>
              <h5 style="color:white">Error loading YouTube reviews</h5>
              <p style="color:#e4e0e0">There was a problem analyzing YouTube reviews for this movie.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

// Function to create YouTube sentiment distribution chart
function createYouTubeSentimentChart(posCount, neuCount, negCount) {
  const chart = document.getElementById('youtubeSentimentChart');
  if (!chart) {
    console.error('YouTube sentiment chart canvas not found');
    return;
  }

  new Chart(chart, {
    type: 'pie',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [posCount, neuCount, negCount],
        backgroundColor: [
          'rgba(40, 167, 69, 0.7)',   // Green for positive
          'rgba(255, 193, 7, 0.7)',   // Yellow for neutral
          'rgba(220, 53, 69, 0.7)'    // Red for negative
        ],
        borderColor: [
          'rgb(40, 167, 69)',
          'rgb(255, 193, 7)',
          'rgb(220, 53, 69)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'white',
            padding: 10,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} reviews (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Function to toggle YouTube reviews display
function toggleYouTubeDisplay() {
  const container = document.getElementById('youtubeSamplesContainer');
  const btn = document.getElementById('toggleYouTubeBtn');
  
  if (!container || !btn) {
    console.error('Toggle elements not found');
    return;
  }
  
  if (container.style.display === 'none') {
    container.style.display = '';
    btn.textContent = 'Hide Reviews';
  } else {
    container.style.display = 'none';
    btn.textContent = 'Show Reviews';
  }
}

// Function to update comparison chart to include YouTube
function updateComparisonChart(youtubeScore) {
  const existingChart = Chart.getChart('comparisonChart');
  
  if (existingChart) {
    // Check if YouTube is already in the chart
    const labels = existingChart.data.labels;
    const youtubeIndex = labels.indexOf('YouTube Sentiment');
    
    if (youtubeIndex === -1) {
      // YouTube not in chart, add it
      existingChart.data.labels.push('YouTube Sentiment');
      existingChart.data.datasets[0].data.push(youtubeScore);
      existingChart.data.datasets[0].backgroundColor.push('rgba(255, 0, 0, 0.7)');
      existingChart.data.datasets[0].borderColor.push('rgb(255, 0, 0)');
      
      // Update chart
      existingChart.update();
      
      // Update comparison summary text if it exists
      updateComparisonSummary(youtubeScore);
    } else {
      // YouTube already in chart, update its value
      existingChart.data.datasets[0].data[youtubeIndex] = youtubeScore;
      existingChart.update();
    }
  } else {
    console.error('Comparison chart not found or not initialized');
  }
}

// Function to update comparison summary text
function updateComparisonSummary(youtubeScore) {
  const summaryContainer = document.querySelector(".col-md-4.d-flex.align-items-center div");
  if (summaryContainer) {
    // Get the existing paragraph elements
    const paragraphs = summaryContainer.querySelectorAll("p");
    if (paragraphs.length >= 2) {
      // Update the second paragraph to include YouTube
      const scoresParagraph = paragraphs[1];
      
      // Check if YouTube is already mentioned
      if (!scoresParagraph.innerHTML.includes("YouTube Sentiment:")) {
        scoresParagraph.innerHTML += `<br>YouTube Sentiment: <strong>${youtubeScore}/10</strong>`;
      }
    }
  }
}

// Improved initialization function
function initializeYouTubeReviews() {
  console.log('Checking if we should initialize YouTube reviews...');
  
  // Check if we're on a movie details page
  const titleElement = document.getElementById('title');
  if (titleElement && titleElement.textContent) {
    // Extract the movie title from the element text (format: "TITLE: Movie Name")
    const titleText = titleElement.textContent;
    const movieTitle = titleText.split(':')[1]?.trim() || titleText.trim();
    
    if (movieTitle) {
      console.log('Initializing YouTube reviews for:', movieTitle);
      
      // Add a slight delay to ensure DOM is fully loaded
      setTimeout(() => {
        displayYouTubeReviews(movieTitle);
      }, 800);
    } else {
      console.log('Could not extract movie title from:', titleText);
    }
  } else {
    console.log('Not on a movie details page, skipping YouTube reviews initialization');
  }
}

// Add this at the very end of your recommend.js file
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, initializing...');
  initializeYouTubeReviews();
});




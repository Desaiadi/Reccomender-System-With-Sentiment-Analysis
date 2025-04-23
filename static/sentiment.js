// Initialize sentiment dashboard after page load
document.addEventListener('DOMContentLoaded', function() {
    // Create gauge charts
    createSentimentGauges();
    
    // Show sample tweets
    displaySampleTweets();
    
    // Initialize timeline chart if available
    initializeTimelineChart();
  
    // Create sentiment distribution chart
    createSentimentDistributionChart();
  
    // Create comparison chart
    createComparisonChart();


});

// Create gauge charts for sentiment scores
function createSentimentGauges() {
    // Twitter sentiment gauge
    createGaugeChart('twitterGauge', twitterSentimentScore);
    
    // Overall sentiment gauge (same as Twitter for now)
    createGaugeChart('overallGauge', twitterSentimentScore);
    
    // IMDB sentiment gauge if available
    if (typeof imdbSentimentScore !== 'undefined') {
        createGaugeChart('imdbGauge', imdbSentimentScore);
    }
}

// Create a single gauge chart
function createGaugeChart(canvasId, score) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate color based on score (red to green gradient)
    const r = Math.round(255 - (score * 25.5));
    const g = Math.round(score * 25.5);
    const color = `rgb(${r}, ${g}, 0)`;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 10 - score],
                backgroundColor: [
                    color,
                    'rgba(60, 60, 60, 0.2)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            circumference: 180,
            rotation: 270,
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                animateRotate: true,
                animateScale: true
            },
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// Display sample tweets in the UI
function displaySampleTweets() {
    const tweetContainer = document.getElementById('tweetSamples');
    if (!tweetContainer || !twitterSampleContent) return;
    
    // Clear existing content
    tweetContainer.innerHTML = '';
    
    // Add each tweet to the container
    twitterSampleContent.forEach(tweet => {
        const tweetElement = document.createElement('div');
        tweetElement.className = 'sample-item';
        tweetElement.textContent = tweet;
        tweetContainer.appendChild(tweetElement);
    });
}

// Function to toggle tweet display
function toggleTweetDisplay() {
    const tweetContainer = document.getElementById('tweetSamples');
    if (tweetContainer) {
        const isVisible = tweetContainer.style.display !== 'none';
        tweetContainer.style.display = isVisible ? 'none' : 'block';
        
        // Update button text
        const btn = document.getElementById('toggleTweetsBtn');
        if (btn) {
            btn.textContent = isVisible ? 'Show Sample Tweets' : 'Hide Sample Tweets';
        }
    }
}

// Initialize the tweet timeline chart
function initializeTimelineChart() {
    const ctx = document.getElementById('tweetTimelineChart');
    if (!ctx) return;
    
    let timelineData;
    
    // Use actual timeline data if available, otherwise generate sample data
    if (typeof twitterTimeline !== 'undefined') {
      timelineData = twitterTimeline;
    } else {
      // Generate some sample data for demonstration
      const dates = [];
      const positiveScores = [];
      const neutralScores = [];
      const negativeScores = [];
      
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Random sentiment percentages
        const positive = Math.floor(Math.random() * 60) + 20; // 20-80%
        const neutral = Math.floor(Math.random() * 30); // 0-30%
        const negative = 100 - positive - neutral;
        
        positiveScores.push(positive);
        neutralScores.push(neutral);
        negativeScores.push(negative);
      }
      
      timelineData = {
        dates: dates,
        positive: positiveScores,
        neutral: neutralScores,
        negative: negativeScores
      };
    }
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: timelineData.dates,
        datasets: [
          {
            label: 'Positive',
            data: timelineData.positive,
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            borderColor: 'rgb(40, 167, 69)',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Neutral',
            data: timelineData.neutral,
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            borderColor: 'rgb(255, 193, 7)',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Negative',
            data: timelineData.negative,
            backgroundColor: 'rgba(220, 53, 69, 0.2)',
            borderColor: 'rgb(220, 53, 69)',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Sentiment (%)',
              color: 'white'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white',
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'white'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'white',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + '%';
                }
                return label;
              }
            }
          }
        }
      }
    });
  }




// New Functions to create sentiment Data
// Create the sentiment distribution chart
function createSentimentDistributionChart() {
    const distributionCtx = document.getElementById('sentimentDistributionChart');
    if (!distributionCtx) return;
    
    new Chart(distributionCtx, {
      type: 'pie',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [positiveCount, neutralCount, negativeCount],
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
                return `${label}: ${value} tweets (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Create the comparison chart
function createComparisonChart() {
    const comparisonCtx = document.getElementById('comparisonChart');
    if (!comparisonCtx) return;
    
    new Chart(comparisonCtx, {
      type: 'bar',
      data: {
        labels: ['Twitter Sentiment', 'IMDB Sentiment'],
        datasets: [{
          label: 'Sentiment Score (0-10)',
          data: [twitterSentimentScore, imdbSentimentScore],
          backgroundColor: [
            'rgba(29, 161, 242, 0.7)',  // Twitter blue
            'rgba(245, 197, 24, 0.7)'   // IMDB yellow
          ],
          borderColor: [
            'rgb(29, 161, 242)',
            'rgb(245, 197, 24)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            title: {
              display: true,
              text: 'Sentiment Score',
              color: 'white'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'white'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
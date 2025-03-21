const { pLimit, withRetry } = require('./index');
const https = require('https');

/**
 * Simple promise-based HTTP request function
 * @param {string} url - The URL to fetch
 * @returns {Promise<Object>} - Parsed JSON response
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const { statusCode } = res;
      
      if (statusCode !== 200) {
        // Consume response data to free up memory
        res.resume();
        reject(new Error(`Request failed with status: ${statusCode}`));
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(new Error(`Error parsing JSON: ${e.message}`));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`HTTP request error: ${e.message}`));
    });
  });
}

/**
 * Fetches user data from a public API
 * @param {number} userId - User ID to fetch
 * @returns {Promise<Object>} - User data
 */
async function fetchUserData(userId) {
  console.log(`Fetching user ${userId}...`);
  const data = await httpGet(`https://jsonplaceholder.typicode.com/users/${userId}`);
  console.log(`Successfully fetched user ${userId}: ${data.name}`);
  return data;
}

/**
 * Fetches post data from a public API
 * @param {number} postId - Post ID to fetch
 * @returns {Promise<Object>} - Post data
 */
async function fetchPostData(postId) {
  console.log(`Fetching post ${postId}...`);
  const data = await httpGet(`https://jsonplaceholder.typicode.com/posts/${postId}`);
  console.log(`Successfully fetched post ${postId}: ${data.title.substring(0, 30)}...`);
  return data;
}

/**
 * Simulates a flaky API call
 * @param {number} resourceId - Resource ID to fetch
 * @returns {Promise<Object>} - Resource data
 */
async function fetchFlakyResource(resourceId) {
  console.log(`Fetching resource ${resourceId}...`);
  
  // Simulate random failures (50% chance)
  if (Math.random() < 0.5) {
    console.log(`Resource ${resourceId} request failed!`);
    throw new Error(`Network error for resource ${resourceId}`);
  }
  
  // Simulate successful response after delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Successfully fetched resource ${resourceId}`);
  return { id: resourceId, name: `Resource ${resourceId}`, status: 'active' };
}

async function main() {
  try {
    // Create a limiter with concurrency of 3 and default retry options
    const limit = pLimit(3, {
      retry: {
        retries: 2,
        initialDelay: 300,
        backoffFactor: 2,
        maxDelay: 3000
      }
    });
    
    console.log('=== FETCHING USERS (CONCURRENCY: 3) ===');
    // Fetch 10 users with concurrency limit
    const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const userPromises = userIds.map(id => limit(() => fetchUserData(id)));
    const users = await Promise.all(userPromises);
    console.log(`Fetched ${users.length} users`);
    
    console.log('\n=== FETCHING POSTS (CONCURRENCY: 3) ===');
    // Fetch 5 posts with concurrency limit
    const postIds = [1, 2, 3, 4, 5];
    const postPromises = postIds.map(id => limit(() => fetchPostData(id)));
    const posts = await Promise.all(postPromises);
    console.log(`Fetched ${posts.length} posts`);
    
    console.log('\n=== FETCHING FLAKY RESOURCES WITH RETRIES ===');
    // Create specialized limiter for flaky resources with more aggressive retry
    const flakyLimit = pLimit(2, {
      retry: {
        retries: 3,
        initialDelay: 200,
        backoffFactor: 1.5,
        maxDelay: 2000
      }
    });
    
    // Fetch 5 flaky resources with retry
    const resourceIds = [101, 102, 103, 104, 105];
    const resourcePromises = resourceIds.map(id => 
      flakyLimit(() => fetchFlakyResource(id))
    );
    
    try {
      const resources = await Promise.all(resourcePromises);
      console.log(`Successfully fetched all ${resources.length} resources`);
    } catch (error) {
      console.error('Some resources failed to fetch even after retries:', error.message);
    }
    
    console.log('\n=== MIXED WORKLOAD EXAMPLE ===');
    // Create a mixed batch of different API calls
    const mixedPromises = [
      limit(() => fetchUserData(1)),
      limit(() => fetchPostData(1)),
      flakyLimit(() => fetchFlakyResource(201)),
      limit(() => fetchUserData(2)),
      flakyLimit(() => fetchFlakyResource(202))
    ];
    
    try {
      const mixedResults = await Promise.allSettled(mixedPromises);
      console.log('Mixed results summary:');
      mixedResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`- Task ${index + 1}: Success`);
        } else {
          console.log(`- Task ${index + 1}: Failed - ${result.reason.message}`);
        }
      });
    } catch (error) {
      console.error('Error in mixed workload:', error.message);
    }
    
  } catch (error) {
    console.error('Main process error:', error.message);
  }
}

// Run the example
main(); 
"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

// added hide page components, log in form was showing at bottom of page after login complete

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");
  hidePageComponents();
  $allStoriesList.show();
  updateNavOnLogin();
}


// **Handle user favorites

async function toggleFavorite(evt) {
  const user = currentUser.username;
  const token = currentUser.loginToken;
  let storyId = $(this).closest('li').attr('id');
  if ($(this).closest('i').hasClass('fa-regular fa-heart')) {
    $(this).closest('i').toggleClass('fa-regular fa-heart');
    $(this).closest('i').toggleClass('fa-solid fa-heart');
    await axios.post(`https://hack-or-snooze-v3.herokuapp.com/users/${user}/favorites/${storyId}`, {
      'token': token
    }
    )
  }
  else if ($(this).closest('i').hasClass('fa-solid fa-heart')) {
    $(this).closest('i').toggleClass('fa-regular fa-heart');
    $(this).closest('i').toggleClass('fa-solid fa-heart');
    await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/users/${user}/favorites/${storyId}?token=${token}`)
  }
}

$('.stories-list').on('click', '.fav-icon', toggleFavorite)

// fill favorite stories page

async function putFavoritesOnPage() {
  hidePageComponents();
  $storiesLoadingMsg.show();
  $allStoriesList.empty();
  let favoriteStoryList = await StoryList.getFavoriteStories();
  for (let story of favoriteStoryList.stories) {
    const $story = generateStoryMarkup(story);
    let $storyUser = story.username;
    if ($storyUser === currentUser.username) {
      // add remove option for stories posted by current user
      $story.append('<a href="#" class="remove-story">(remove)</a>')
      // append story to list if posted by current user
    }
    $allStoriesList.append($story);
    $story.prepend('<i class="fa-solid fa-heart fav-icon"></i>')
    $story.append($('<hr class="breakpoint">'))
  }
  $storiesLoadingMsg.hide();
  $allStoriesList.show();
}

$navFavorites.on('click', putFavoritesOnPage);

// check for favorites

async function checkForFavorite() {
  // let $storyId;
  let favoriteStoryList = await StoryList.getFavoriteStories();
  let favoriteIds=favoriteStoryList.stories.map(story => {
    return(story.storyId);
  })
  
  return favoriteIds;
  }

// Show 'My Stories' page

// tweaked putStoriesOnPage function to only display stories posted by current user
async function putMyStoriesOnPage() {
  console.debug("putStoriesOnPage");
  // submit story/login pages were showing if going from those pages, including to make sure they don't
  hidePageComponents();

  $allStoriesList.empty();

  let favorites = await checkForFavorite();

  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    let $storyId = story.storyId;
    let $storyUser = story.username;
    if ($storyUser === currentUser.username) {
      // add remove option for stories posted by current user
      $story.append('<a href="#" class="remove-story">(remove)</a>')
      // append story to list if posted by current user
      $allStoriesList.append($story);
      if (favorites.indexOf($storyId) !== -1){
        $story.prepend('<i class="fa-solid fa-heart fav-icon"></i>')
      }
      else {
        $story.prepend('<i class="fa-regular fa-heart fav-icon"></i>')
      }
    }
    $story.append($('<hr class="breakpoint">'))
  }
  $allStoriesList.show();
}

$navMyStories.on('click', putMyStoriesOnPage);
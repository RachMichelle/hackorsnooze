"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  try {
    storyList = await StoryList.getStories();
    $storiesLoadingMsg.remove();

    putStoriesOnPage();
  } catch {
    alert('Something went wrong! Please try again.')
  }
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small> 
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  let favorites= await checkForFavorite();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    let $storyUser = story.username;
    let $storyId = story.storyId;
    if ($storyUser === currentUser.username) {
      // console.log('posted by current user', $storyId);
      // add remove option for stories posted by current user
      $story.append('<a href="#" class="remove-story">(remove)</a>')
    }
    $story.append($('<hr class="breakpoint">'))
    $allStoriesList.append($story);

    // add heart icon (favorite) to beginning of story, solid if favorite, regular if not. 
    if (favorites.indexOf($storyId) !== -1){
      $story.prepend('<i class="fa-solid fa-heart fav-icon"></i>')
    }
    else {
      $story.prepend('<i class="fa-regular fa-heart fav-icon"></i>')
    }
  }

  $allStoriesList.show();
}

// Add new story from submit form on click submit button

function submitNewStory(evt) {
  evt.preventDefault();
  let title = $('#title-input').val();
  let author = $('#author-input').val();
  let url = $('#url-input').val();
  // console.log(currentUser, title, author, url);
  storyList.addStory(currentUser, { title: title, author: author, url: url });
  updateUIOnUserLogin()
}

$('#new-story-submit').on("click", submitNewStory);

// Remove story: only works if current user matches story-user

async function removeStory(evt) {
  let deleted = $(this).parent();
  // console.log(deleted);
  let deletedStoryId = $(this).parent().attr('id');
  // console.log(deletedStoryId);
  let token = currentUser.loginToken;
  try {
    await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/stories/${deletedStoryId}?token=${token}`);
    deleted.remove();
  }

  catch (error) {
    alert('Unauthorized')
  }
}

$('.stories-list').on('click', '.remove-story', removeStory);
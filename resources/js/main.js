//========================================================================================
// == Service Worker registration for PWA
//========================================================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', {
      scope: '/' // <--- THIS BIT IS REQUIRED
  }).then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
  }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
  });
}

//========================================================================================
// == Code for soft keys
//========================================================================================

const getCurrentElement = () => document.querySelector("[nav-selected=true]");

const Enter = event => {
  const currentElement = getCurrentElement();
  if (currentElement.tagName === "INPUT") addItem(currentElement.value); else completeTodo(currentElement);
};

const SoftRight = event => {
  const currentElement = getCurrentElement();
  if (currentElement.tagName === "INPUT") return;
  removeTodo(currentElement);
};

const SoftLeft = event => {
};

const setLabels = ({ left, center, right }) => {
  document.getElementById("left").innerHTML = left ? left : "";
  document.getElementById("center").innerHTML = center ? center : "";
  document.getElementById("right").innerHTML = right ? right : "";
};


//========================================================================================
// == Code for navigation using D-pad
//========================================================================================


(() => {
  const firstElement = document.querySelectorAll("[nav-selectable]")[0];
  firstElement.setAttribute("nav-selected", "true");
  firstElement.setAttribute("nav-index", "0");
  firstElement.focus();
})();

const getAllElements = () => document.querySelectorAll("[nav-selectable]");

const getTheIndexOfTheSelectedElement = () => {
  const element = document.querySelector("[nav-selected=true]");
  return element ? parseInt(element.getAttribute("nav-index"), 10) : 0;
};

const selectElement = selectElement =>
  [].forEach.call(getAllElements(), (element, index) => {
    const selectThisElement = element === selectElement;
    element.setAttribute("nav-selected", selectThisElement);
    element.setAttribute("nav-index", index);
    if (element.nodeName === 'INPUT') {
      if (selectThisElement) element.focus(); else element.blur();
    }
  });

const Navigate = (direction, event) => {
  const allElements = getAllElements();
  const currentIndex = getTheIndexOfTheSelectedElement();
  var setIndex;

  switch(direction) {
    case "DOWN":
      const goToFirstElement = currentIndex + 1 > allElements.length - 1;
      setIndex = goToFirstElement ? 0 : currentIndex + 1;
      break;
    case "UP":
      const goToLastElement = currentIndex === 0;
      setIndex = goToLastElement ? allElements.length - 1 : currentIndex - 1;
      break;
    default:
      break;
  }

  selectElement(allElements[setIndex] || allElements[0]);
  setSoftkey(setIndex);

  const element = document.querySelector("[nav-selected=true]");
  //element.scrollIntoView(false);
  scrollToElement(element);
};

function scrollToElement(element) {
  // skip for header (or other non-scrolling elements in future)
  if (parseInt(element.getAttribute("nav-index"), 10) == 0) return;

  var rect = element.getBoundingClientRect();

  if (rect.top < 50) { // header is 50px height at this time
    let moveUp = rect.top - 54; // header + padding at this time
    document.querySelector("#main-content").scrollBy({
      top: moveUp
    });
  }

  if (rect.bottom > (window.innerHeight-30)) { // 30px is the height of softkey bar (footer) at this time
    let moveDown = rect.bottom - window.innerHeight + 36;
    document.querySelector("#main-content").scrollBy({
      top: moveDown
    });
  }
}

const setSoftkey = setIndex =>
  setLabels({
    center: setIndex === 0 ? "Insert" : "Toggle",
    right: setIndex === 0 ? "" : "Delete"
  });


//========================================================================================
// == Code for logic of app
//========================================================================================

var data = (localStorage.getItem('todoList')) ? JSON.parse(localStorage.getItem('todoList')):{
  todo: [],
  completed: []
};

// Remove and complete icons in SVG format
var removeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 22 22" style="enable-background:new 0 0 22 22;" xml:space="preserve"><rect class="noFill" width="22" height="22"/><g><g><path class="fill" d="M16.1,3.6h-1.9V3.3c0-1.3-1-2.3-2.3-2.3h-1.7C8.9,1,7.8,2,7.8,3.3v0.2H5.9c-1.3,0-2.3,1-2.3,2.3v1.3c0,0.5,0.4,0.9,0.9,1v10.5c0,1.3,1,2.3,2.3,2.3h8.5c1.3,0,2.3-1,2.3-2.3V8.2c0.5-0.1,0.9-0.5,0.9-1V5.9C18.4,4.6,17.4,3.6,16.1,3.6z M9.1,3.3c0-0.6,0.5-1.1,1.1-1.1h1.7c0.6,0,1.1,0.5,1.1,1.1v0.2H9.1V3.3z M16.3,18.7c0,0.6-0.5,1.1-1.1,1.1H6.7c-0.6,0-1.1-0.5-1.1-1.1V8.2h10.6V18.7z M17.2,7H4.8V5.9c0-0.6,0.5-1.1,1.1-1.1h10.2c0.6,0,1.1,0.5,1.1,1.1V7z"/></g><g><g><path class="fill" d="M11,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6s0.6,0.3,0.6,0.6v6.8C11.6,17.7,11.4,18,11,18z"/></g><g><path class="fill" d="M8,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6c0.4,0,0.6,0.3,0.6,0.6v6.8C8.7,17.7,8.4,18,8,18z"/></g><g><path class="fill" d="M14,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6c0.4,0,0.6,0.3,0.6,0.6v6.8C14.6,17.7,14.3,18,14,18z"/></g></g></g></svg>';
var completeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 22 22" style="enable-background:new 0 0 22 22;" xml:space="preserve"><rect y="0" class="noFill" width="22" height="22"/><g><path class="fill" d="M9.7,14.4L9.7,14.4c-0.2,0-0.4-0.1-0.5-0.2l-2.7-2.7c-0.3-0.3-0.3-0.8,0-1.1s0.8-0.3,1.1,0l2.1,2.1l4.8-4.8c0.3-0.3,0.8-0.3,1.1,0s0.3,0.8,0,1.1l-5.3,5.3C10.1,14.3,9.9,14.4,9.7,14.4z"/></g></svg>';

renderTodoList();

// User clicked on the add button
// If there is any text inside the item field, add that text to the todo list
document.getElementById('add').addEventListener('click', function() {
  var value = document.getElementById('item').value;
  if (value) {
    addItem(value);
  }
});

/*document.getElementById('item').addEventListener('keydown', function (e) {
  var value = this.value;
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && value) {
    addItem(value);
  }
});*/

function addItem (value) {
  addItemToDOM(value);
  document.getElementById('item').value = '';

  data.todo.push(value);
  dataObjectUpdated();
}

function renderTodoList() {
  var value;
  if (!data.todo.length && !data.completed.length) return;

  for (var i = 0; i < data.todo.length; i++) {
    value = data.todo[i];
    addItemToDOM(value);
  }

  for (var j = 0; j < data.completed.length; j++) {
    value = data.completed[j];
    addItemToDOM(value, true);
  }
}

function dataObjectUpdated() {
  localStorage.setItem('todoList', JSON.stringify(data));
}

function removeItem() {
  var item = this.parentNode.parentNode;
  removeTodo(item);
}

function removeTodo(item) {
  var parent = item.parentNode;
  var id = parent.id;
  var value = item.innerText;

  if (id === 'todo') {
    data.todo.splice(data.todo.indexOf(value), 1);
  } else {
    data.completed.splice(data.completed.indexOf(value), 1);
  }
  dataObjectUpdated();

  parent.removeChild(item);
  Up();
}

function completeItem() {
  var item = this.parentNode.parentNode;
  completeTodo(item);
}

function completeTodo(item) {
  var parent = item.parentNode;
  var id = parent.id;
  var value = item.firstChild.data;

  if (id === 'todo') {
    data.todo.splice(data.todo.indexOf(value), 1);
    data.completed.push(value);
  } else {
    data.completed.splice(data.completed.indexOf(value), 1);
    data.todo.push(value);
  }
  dataObjectUpdated();

  // Check if the item should be added to the completed list or to re-added to the todo list
  var target = (id === 'todo') ? document.getElementById('completed'):document.getElementById('todo');

  parent.removeChild(item);
  target.insertBefore(item, target.childNodes[0]);
}

// Adds a new item to the todo list
function addItemToDOM(text, completed) {
  var list = (completed) ? document.getElementById('completed'):document.getElementById('todo');

  var item = document.createElement('li');
  item.innerHTML = text;

  var buttons = document.createElement('div');
  buttons.classList.add('buttons');

  var remove = document.createElement('button');
  remove.classList.add('remove');
  remove.innerHTML = removeSVG;

  // Add click event for removing the item
  remove.addEventListener('click', removeItem);

  var complete = document.createElement('button');
  complete.classList.add('complete');
  complete.innerHTML = completeSVG;

  // Add click event for completing the item
  complete.addEventListener('click', completeItem);

  buttons.appendChild(remove);
  buttons.appendChild(complete);
  item.appendChild(buttons);
  item.setAttribute("nav-selectable", "true");

  list.insertBefore(item, list.childNodes[0]);
}


//========================================================================================
// == Key handling on keyboard
//========================================================================================

document.addEventListener("keydown", event => {
  switch (event.key) {
    case "Enter":
    case "NumpadEnter":
      return Enter(event);
    case "ArrowDown":
      return Navigate("DOWN", event);
    case "ArrowUp":
      return Navigate("UP", event);
    //case "ArrowRight": // TODO: for use on buggy emulator, could be a good idea to remove after testing
    case "SoftRight":
      return SoftRight(event);
    default:
      return;
  }
});



//========================================================================================
// == Key handling on keyboard
//========================================================================================

/**
 * Method for sending to-do item to API
 * /
function sendTaskToAPI(item, callback) {
  var req = new XMLHttpRequest();
  req.open('POST', '/tasks/add');
  req.setRequestHeader('Content-Type', 'application/json');
  req.send(JSON.stringify({ item: item }));

  req.addEventListener('load', () => {
    var results = JSON.parse(req.responseText);
    if (results.error) return console.log(results.error);

    if (callback) callback(results);
  });

  req.addEventListener('error', (e) => {
    console.log('Shit, something bad happened.');
    console.log(e);
  });
}
*/
/**
 * Will fetch all tasks from API.
 * /
function getTasks(callback) {
  var req = new XMLHttpRequest();
  req.open('GET', '/tasks');
  req.send();

  req.addEventListener('load', () => {
    var results = JSON.parse(req.responseText);
    if (results.error) return console.log(results.error);

    if (callback) callback(results);
  });

  req.addEventListener('error', (e) => {
    console.log('Shit, something bad happened.');
    console.log(e);
  });
}
*/

/*
const app = document.getElementById('root')

const logo = document.createElement('img')
logo.src = 'logo.png'

const container = document.createElement('div')
container.setAttribute('class', 'container')

app.appendChild(logo)
app.appendChild(container)

var request = new XMLHttpRequest()
request.open('GET', 'https://ghibliapi.herokuapp.com/films', true)
request.onload = function() {
  // Begin accessing JSON data here
  var data = JSON.parse(this.response)
  if (request.status >= 200 && request.status < 400) {
    data.forEach(movie => {
      const card = document.createElement('div')
      card.setAttribute('class', 'card')

      const h1 = document.createElement('h1')
      h1.textContent = movie.title

      const p = document.createElement('p')
      movie.description = movie.description.substring(0, 300)
      p.textContent = `${movie.description}...`

      container.appendChild(card)
      card.appendChild(h1)
      card.appendChild(p)
    })
  } else {
    const errorMessage = document.createElement('marquee')
    errorMessage.textContent = `Gah, it's not working!`
    app.appendChild(errorMessage)
  }
}

request.send()
*/




//========================================================================================
// == Online / Offline detection code
//========================================================================================
/*
(function () {
  'use strict';

  var header = document.querySelector('header');
  var menuHeader = document.querySelector('.menu__header');

  //After DOM Loaded
  document.addEventListener('DOMContentLoaded', function(event) {
    //On initial load to check connectivity
    if (!navigator.onLine) {
      updateNetworkStatus();
    }

    window.addEventListener('online', updateNetworkStatus, false);
    window.addEventListener('offline', updateNetworkStatus, false);
  });

  //To update network status
  function updateNetworkStatus() {
    if (navigator.onLine) {
      header.classList.remove('app__offline');
      menuHeader.style.background = '#1E88E5';
    }
    else {
      toast('You are now offline..');
      header.classList.add('app__offline');
      menuHeader.style.background = '#9E9E9E';
    }
  }
})();
*/
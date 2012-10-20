// TODO(justinlilly): xsrf?

// Global state about whether the ctrl key is pressed. Hacky, but I
// didn't want to bother with an external library. Will probably do
// that if folks like it.
var ctrlPressed = false;

function switch_to_tab(tab_id) {
  chrome.tabs.update(tab_id, {'active': true});
}

function select_nth_result(n) {
  var idx = n - 1;
  if (n == -1) {
    // account for 0 == 10, and offset
    idx = 10;
  }
  switch_to_tab(
    get_tab_id_from_elem(
      document.querySelectorAll("ol li a")[idx]));
}

function clickHandler(e) {
  switch_to_tab(get_tab_id_from_elem(e.target));
}

function get_tab_id_from_elem(elem) {
  return parseInt(elem.attributes["tab_id"].nodeValue)
}

function get_search_term() {
  var elem = document.querySelector('input');
  return elem.value;
}

function display_tabs_found(tabs) {
  var tab_list = document.getElementById("tab_list");
  var errors = document.getElementById("errors");
  if (tabs.length == 0) {
    if (get_search_term() === "") {
      errors.innerHTML = "";
    } else {
      errors.innerHTML = "<li>Sorry. None found.</li>";
    }
    tab_list.innerHTML = "";
  } else {
    errors.innerHTML = "";
    var lis = "";
    for (var i = 0; i < tabs.length; i++) {
      if (i < 10) {
        lis += '<li><a href="#" tab_id="' + tabs[i].id + '">'
             + tabs[i].label + '</a></li>';
      } else if (i == 10) {
        lis += "<li>There are a total of " + tabs.length + ", but you only get 10.";
      }
    }

    tab_list.innerHTML = lis;

    var els = document.querySelectorAll('a')
    for (var j = 0; j < els.length; j++) {
      els[j].addEventListener('click', clickHandler);
    }
  }
}

function query_for_tabs(search_term) {
  var tab_result = [];
  if (search_term === "") {
    display_tabs_found(tab_result);
    return;
  }
  var search_term_escaped = search_term.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  chrome.tabs.query({}, function(tab_arr) {
    for (var i = 0; i < tab_arr.length; i++) {
      var tab = tab_arr[i];
      var reg = new RegExp(".*" + search_term_escaped + ".*", "i");
      console.log("Looking for %o", reg);
      if (tab.title.search(reg) != -1 || tab.url.search(reg) != -1) {
        console.log("Matches: %o", tab);
        tab.label = tab.title.replace(new RegExp(
          "(?![^&;]+;)(?!<[^<>]*)(" + search_term_escaped +
          ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<em>$1</em>");
        tab_result.push(tab);
      }
    }
    display_tabs_found(tab_result);
  });
}

function resetPrevious() {
  document.getElementById("tab_list").innerHTML = "";
  document.getElementById("errors").innerHTML = "";
}

function keypressHandler(e) {
  if (e.keyCode == 17) {
    ctrlPressed = true;
    console.log("ctrl pressed");
  } else if (ctrlPressed && e.keyCode >= 48 && e.keyCode <= 57) {
    console.log("Not quite the right keypress. Ctrl: %o, num: %o", ctrlPressed, e.keyCode - 48);
    // number pressed
    select_nth_result(e.keyCode - 48); // send along the number pressed.
  } else {
    console.log("Not quite the right keypress. Ctrl: %o, keyCode: %o", ctrlPressed, e.keyCode);
  }
}

function keyupHandler(e) {
  if (e.keyCode == 17) {
    ctrlPressed = false;
    console.log("ctrl released");
  }
  query_for_tabs(get_search_term());
}

function main() {
  document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    var tab_list = document.getElementById("tab_list");
    if (tab_list.hasChildNodes()) {
      select_nth_result(1);
    }
  });
}


document.onkeydown = keypressHandler;
document.onkeyup = keyupHandler;

main();

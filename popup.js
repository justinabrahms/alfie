// TODO(justinlilly): xsrf?

// Escape string so it can be used in regex search
// taken from http://stackoverflow.com/a/3561711/238628
RegExp.escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// Global state about whether the ctrl key is pressed. Hacky, but I
// didn't want to bother with an external library. Will probably do
// that if folks like it.
var ctrlPressed = false;
var tab_list_el = document.getElementById("tab_list");
var errors_el = document.getElementById("errors");
var input_el = document.getElementById("input");

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
  return input_el.value;
}

function display_no_results(search_term) {
  errors_el.innerHTML = "<li>Sorry. None found.</li>";
  tab_list_el.innerHTML = "";
}

function display_empty_results(term) {
  errors_el.innerHTML = "";
  tab_list_el.innerHTML = "";
}

function display_results(tabs, search_term) {
  errors_el.innerHTML = "";

  var lis = "";
  for (var i = 0; i < tabs.length; i++) {
    if (i < 10) {
      lis += '<li><a href="#" tab_id="' + tabs[i].id + '">'
           + tabs[i].label + '</a></li>';
    } else if (i == 10) {
      lis += "<li>There are a total of " + tabs.length + ", but you only get 10.";
    }
  }

  tab_list_el.innerHTML = lis;

  var els = document.querySelectorAll('a')
  for (var j = 0; j < els.length; j++) {
    els[j].addEventListener('click', clickHandler);
  }
}

function display_tabs_found(tabs) {
  var search_term = get_search_term();
  if (tabs.length === 0) {
    if (search_term === "") {
      display_empty_results();
    } else {
      display_no_results(search_term);
    }
  } else {
    display_results(tabs, search_term);
  }
}

function query_for_tabs(search_term) {
  var tab_result = [];
  if (search_term === "") {
    display_tabs_found(tab_result);
    return;
  }
  var search_term_escaped = RegExp.escape(search_term);
  chrome.tabs.query({}, function(tab_arr) {
    for (var i = 0; i < tab_arr.length; i++) {
      var tab = tab_arr[i];
      console.log("Looking for %o", search_term_escaped);
      var search_term_re = new RegExp(search_term_escaped, "i");
      if (tab.title.search(search_term_re) != -1 ||
          tab.url.search(search_term_re) != -1) {
        console.log("Matches: %o", tab);
        // wrap search term in <em> tag:
        // "Inbox (1)".replace(new RegExp("(" + "inbox" + ")", "gi"), '<em>$1</em>')
        // "<em>Inbox</em> (1)"
        tab.label = tab.title.replace(
          new RegExp("(" + search_term_escaped + ")", "gi"),
          '<em>$1</em>');
        tab_result.push(tab);
      }
    }
    display_tabs_found(tab_result);
  });
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

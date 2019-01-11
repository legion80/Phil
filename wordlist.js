// Phil
// ------------------------------------------------------------------------
// Copyright 2017 Keiran King

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// (https://www.apache.org/licenses/LICENSE-2.0)

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ------------------------------------------------------------------------

let wordlist = [
  [], [], [], [], [],
  [], [], [], [], [],
  [], [], [], [], [], []
];

openDefaultWordlist("https://raw.githubusercontent.com/keiranking/Phil/master/WL-SP.txt");

//____________________
// F U N C T I O N S

function addToWordlist(newWords) {
  for (i = 0; i < newWords.length; i++) {
    const word = newWords[i].trim().toUpperCase();
    if (word.length < wordlist.length) { // Make sure we don't access outside the wordlist array
      wordlist[word.length].push(word);
    }
  }
}

function sortWordlist() {
  for (let i = 3; i < wordlist.length; i++) {
    wordlist[i].sort();
  }
}

function openWordlist() {
  document.getElementById("open-wordlist-input").click();
}

function openWordlistFile(e) {
  wordlist = [
    [], [], [], [], [],
    [], [], [], [], [],
    [], [], [], [], [], []
  ];

  const file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  reader.onload = function(e) {
    const words = e.target.result.split(/\s/g);
    addToWordlist(words);
    sortWordlist();
    removeWordlistDuplicates();
    invalidateSolverWordlist();
  };
  reader.readAsText(file);
}

function openDefaultWordlist(url) {
  let textFile = new XMLHttpRequest();
  textFile.open("GET", url, true);
  textFile.onreadystatechange = function() {
    if (textFile.readyState === 4 && textFile.status === 200) {  // Makes sure the document is ready to parse, and it's found the file.
      const words = textFile.responseText.split(/\s/g);
      addToWordlist(words);
      sortWordlist();
      console.log("Loaded default wordlist.")
    }
  }
  textFile.send(null);
}

function removeWordlistDuplicates() {
  for (let i = 3; i < wordlist.length; i++) {
    if (wordlist[i].length >= 2) {
      for (let j = wordlist[i].length - 1; j >0; j--) {
        if (wordlist[i][j] == wordlist[i][j - 1]) {
          wordlist[i].splice(j, 1);
        }
      }
    }
  }
}

function matchFromWordlist(word, firstCharacterIndex) {
  const l = word.length;
  const actualLettersInWord = word.replace(/-/g, "").length;
  if (actualLettersInWord >= 1 && actualLettersInWord < l) { // Only search if word isn't completely blank or filled
    word = word.split(DASH).join("\\w");
    const pattern = new RegExp(word);
    let matches = [];
    for (let i = 0; i < wordlist[l].length; i++) {
      if (wordlist[l][i].search(pattern) > -1) {
        matches.push(wordlist[l][i]);
      }
    }

    if (firstCharacterIndex == 0) {
      return matches;
    }

    matches.sort(function (a,b) {
      let result = a[firstCharacterIndex].localeCompare(b[firstCharacterIndex]);
      if (result != 0)
        return result;
      return a.localeCompare(b);
    });
    return matches;
  } else {
    return [];
  }
}

function updateMatchesUI() {
  let acrossMatchList = document.getElementById("across-matches");
  let downMatchList = document.getElementById("down-matches");
  acrossMatchList.innerHTML = "";
  downMatchList.innerHTML = "";

  const acrossCharacterIndex = current.col - current.acrossStartIndex;
  const acrossMatches = matchFromWordlist(current.acrossWord, acrossCharacterIndex);
  const downCharacterIndex = current.row - current.downStartIndex;
  const downMatches = matchFromWordlist(current.downWord, downCharacterIndex);
  const characterMatch = {};

  let previousChar = null;
  for (i = 0; i < acrossMatches.length; i++) {
    if (!previousChar) {
      previousChar = acrossMatches[i][acrossCharacterIndex].toLowerCase();
      continue;
    }

    let currentChar = acrossMatches[i][acrossCharacterIndex].toLowerCase();
    if (currentChar != previousChar) {
      characterMatch[previousChar] = 1;
      previousChar = currentChar;
    }
  }
  if (previousChar) {
    characterMatch[previousChar] = 1;
  }
  previousChar = null;
  for (i = 0; i < downMatches.length; i++) {
    if (!previousChar) {
      previousChar = downMatches[i][downCharacterIndex].toLowerCase();
      continue;
    }

    let currentChar = downMatches[i][downCharacterIndex].toLowerCase();
    if (currentChar != previousChar) {
      characterMatch[previousChar] = characterMatch[previousChar] ? 2 : 1;
      previousChar = currentChar;
    }
  }
  if (previousChar) {
    characterMatch[previousChar] = characterMatch[previousChar] ? 2 : 1;
  }
  console.log(characterMatch);
  let previousFirstWordMatch = null, previousIndex = -1;
  previousChar = null;
  for (i = 0; i < acrossMatches.length; i++) {
    let li = document.createElement("LI");
    let word = acrossMatches[i].toLowerCase();
    let before = word.substring(0, acrossCharacterIndex);
    let char = word[acrossCharacterIndex];
    let after = word.substring(acrossCharacterIndex + 1);
    let matchClass = characterMatch[char] === 2 ? "match" : "";
    console.log(char+": "+characterMatch[char]);
    li.innerHTML = `${before}<span class="current ${matchClass}">${char}</span>${after}`;
    li.className = "";
    // li.addEventListener('click', printScore);
    li.addEventListener('dblclick', fillGridWithMatch);
    acrossMatchList.appendChild(li);

    if (!previousFirstWordMatch) {
      previousFirstWordMatch = li;
      previousChar = char;
      previousIndex = i;
    } else if (char != previousChar) {
      previousFirstWordMatch.innerHTML += ` <span class="count">${i - previousIndex}/${acrossMatches.length}</span>`;
      previousFirstWordMatch = li;
      previousChar = char;
      previousIndex = i;
    }
  }
  if (previousFirstWordMatch) {
    previousFirstWordMatch.innerHTML += ` <span class="count">${i - previousIndex}/${acrossMatches.length}</span>`;
  }

  previousFirstWordMatch = null;
  previousChar = null;
  previousIndex = -1;
  for (i = 0; i < downMatches.length; i++) {
    let li = document.createElement("LI");
    let word = downMatches[i].toLowerCase();
    let before = word.substring(0, downCharacterIndex);
    let char = word[downCharacterIndex];
    let after = word.substring(downCharacterIndex + 1);
    let matchClass = characterMatch[char] === 2 ? "match" : "";
    console.log(char+": "+characterMatch[char]);
    li.innerHTML = `${before}<span class="current ${matchClass}">${char}</span>${after}`;
    li.className = "";
    li.addEventListener('dblclick', fillGridWithMatch);
    downMatchList.appendChild(li);

    if (!previousFirstWordMatch) {
      previousFirstWordMatch = li;
      previousChar = char;
      previousIndex = i;
    } else if (char != previousChar) {
      previousFirstWordMatch.innerHTML += ` <span class="count">${i - previousIndex}/${downMatches.length}</span>`;
      previousFirstWordMatch = li;
      previousChar = char;
      previousIndex = i;
    }
  }
  if (previousFirstWordMatch) {
    previousFirstWordMatch.innerHTML += ` <span class="count">${i - previousIndex}/${downMatches.length}</span>`;
  }
}

function fillGridWithMatch(e) {
  const li = e.currentTarget;
  const fill = li.innerHTML.toUpperCase();
  const dir = (li.parentNode.id == "across-matches") ? ACROSS : DOWN;

  if (dir == ACROSS) {
    xw.fill[current.row] = xw.fill[current.row].slice(0, current.acrossStartIndex) + fill + xw.fill[current.row].slice(current.acrossEndIndex);
    for (let i = current.acrossStartIndex; i < current.acrossEndIndex; i++) {
      const square = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]');
      square.lastChild.innerHTML = fill[i - current.acrossStartIndex];
    }
  } else {
    for (let j = current.downStartIndex; j < current.downEndIndex; j++) {
      xw.fill[j] = xw.fill[j].slice(0, current.col) + fill[j - current.downStartIndex] + xw.fill[j].slice(current.col + 1);
      const square = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]');
      square.lastChild.innerHTML = fill[j - current.downStartIndex];
    }
  }
  isMutated = true;
  console.log("Filled '" + li.innerHTML + "' going " + dir);
  // updateActiveWords();
  // updateMatchesUI();
  updateUI();
  grid.focus();
}

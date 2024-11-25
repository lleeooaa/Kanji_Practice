let kanjiList = [];
let currentKanji = null;
let currentIndex = 0;
let correctCount = 0;
let totalAttempts = 0;
let streak = 0;
let bestStreak = 0;
let currentMode = '';
let teachingWords = [];
let currentTeachingIndex = 0;
let isLearningPhase = true;
let meaningShown = false;
let enter_checked = false;
let wrongAnswers = [];
let reviewWords = [];

function selectMode(mode) {
    currentMode = mode;
    document.getElementById('level-selection').innerHTML = mode === 'practice' 
        ? createPracticeLevelSelection() 
        : createTeachingLevelSelection();
    openSettings();
}

function createPracticeLevelSelection() {
    return `
        <div class="checkbox-group">
            <label class="checkbox-item">
                <input type="checkbox" value="n1"> JLPT N1 (Advanced)
            </label>
            <label class="checkbox-item">
                <input type="checkbox" value="n2"> JLPT N2 (Upper Intermediate)
            </label>
            <label class="checkbox-item">
                <input type="checkbox" value="n3"> JLPT N3 (Intermediate)
            </label>
            <label class="checkbox-item">
                <input type="checkbox" value="n4"> JLPT N4 (Lower Intermediate)
            </label>
            <label class="checkbox-item">
                <input type="checkbox" value="n5"> JLPT N5 (Basic)
            </label>
        </div>
    `;
}

function createTeachingLevelSelection() {
    return `
        <div class="checkbox-group">
            <label class="checkbox-item">
                <input type="radio" name="level" value="n1"> JLPT N1 (Advanced)
            </label>
            <label class="checkbox-item">
                <input type="radio" name="level" value="n2"> JLPT N2 (Upper Intermediate)
            </label>
            <label class="checkbox-item">
                <input type="radio" name="level" value="n3"> JLPT N3 (Intermediate)
            </label>
            <label class="checkbox-item">
                <input type="radio" name="level" value="n4"> JLPT N4 (Lower Intermediate)
            </label>
            <label class="checkbox-item">
                <input type="radio" name="level" value="n5"> JLPT N5 (Basic)
            </label>
        </div>
    `;
}

function startSelected() {
    if (currentMode === 'practice') {
        startPractice();
    } else {
        startTeaching();
    }
}

function startTeaching() {
    const selectedLevel = document.querySelector('input[name="level"]:checked')?.value;
    if (!selectedLevel) {
        alert('Please select a level');
        return;
    }

    // Load kanji for the selected level
    loadKanjiFile(selectedLevel).then(allWords => {
        // Get today's date as seed
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        // Get 10 random words for today using the date seed
        teachingWords = getRandomWordsWithSeed(allWords, 10, seed);
        
        // Reset teaching state
        currentTeachingIndex = 0;
        isLearningPhase = true;
        
        // Show teaching area
        document.getElementById('practice-area').style.display = 'none';
        document.getElementById('results-area').style.display = 'none';
        document.getElementById('teaching-area').style.display = 'block';
        document.getElementById('level-display').textContent = `Level: ${selectedLevel.toUpperCase()}`;
        closeSettings();
        
        showTeachingWord();
    });
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

function getRandomWordsWithSeed(array, count, seed) {
    const shuffled = array.slice();
    let currentIndex = shuffled.length;
    let temporaryValue, randomIndex;

    // Use seed to generate random numbers
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    while (currentIndex !== 0) {
        randomIndex = Math.floor(random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = shuffled[currentIndex];
        shuffled[currentIndex] = shuffled[randomIndex];
        shuffled[randomIndex] = temporaryValue;
    }

    return shuffled.slice(0, count);
}

function showTeachingWord() {
    const word = teachingWords[currentTeachingIndex];
    document.getElementById('word-number').textContent = `Review Word ${currentTeachingIndex + 1} of ${teachingWords.length}` 
    document.getElementById('teaching-kanji').textContent = word.kanji;
    document.getElementById('teaching-meaning').textContent = word.meaning;
    
    if (isLearningPhase) {
        // Learning phase: show all information
        document.getElementById('learning-phase').textContent = 'Learning Phase';
        document.getElementById('teaching-pronunciation').textContent = 
            `Pronunciation: ${word.pronunciation.join(' or ')}`;
        document.getElementById('teaching-input').style.display = 'none';
        document.getElementById('teaching-check').style.display = 'none';
        document.getElementById('teaching-next').style.display = 'block';
        document.getElementById('teaching-result').textContent = '';
    } else {
        document.getElementById('learning-phase').textContent = 'Review Phase';
        document.getElementById('teaching-pronunciation').textContent = '';
        document.getElementById('teaching-input').style.display = 'block';
        document.getElementById('teaching-check').style.display = 'block';
        document.getElementById('teaching-next').style.display = 'none';
        document.getElementById('teaching-answer').value = '';
        document.getElementById('teaching-answer').focus();
    }
}

function nextTeachingWord() {
    if (isLearningPhase) {
        currentTeachingIndex++;
        if (currentTeachingIndex >= teachingWords.length) {
            // Switch to review phase after showing all words
            currentTeachingIndex = 0;
            isLearningPhase = false;
            alert('Learning phase complete! Now let\'s review the pronunciations.');
        }
    } else {
        currentTeachingIndex++;
        if (currentTeachingIndex >= teachingWords.length) {
            if (reviewWords.length > 0) {
                // Add review words to teaching words and reset
                teachingWords = [...reviewWords];
                reviewWords = [];
                currentTeachingIndex = 0;
                alert('Now let\'s review the words you got wrong!');
            } else {
                // Review phase complete with no words to review
                alert('Review complete! Great job!');
                return;
            }
        }
    }
    clearTeachingResults();
    showTeachingWord();
    enter_checked = false;
}

function checkTeachingAnswer() {
    const userAnswer = document.getElementById('teaching-answer').value.trim();
    const correctAnswers = teachingWords[currentTeachingIndex].pronunciation;
    const correct = correctAnswers.some(answer => userAnswer === answer.trim());
    
    if (correct) {
        document.getElementById('teaching-result').innerHTML = 
            `<span class="correct">正解! (Correct!)</span>`;
    } else {
        // Add the word to review list if it's not already there
        const currentWord = teachingWords[currentTeachingIndex];
        if (!reviewWords.some(word => word.kanji === currentWord.kanji)) {
            reviewWords.push(currentWord);
        }
        document.getElementById('teaching-result').innerHTML = 
            `<span class="incorrect">不正解 (Incorrect). Correct answer(s): ${correctAnswers.join(' or ')}</span>`;
    }
    document.getElementById('teaching-next').style.display = 'block';
    document.getElementById('teaching-check').style.display = 'none';
    enter_checked = true;
}

function clearTeachingResults() {
    document.getElementById('teaching-result').textContent = '';
    document.getElementById('teaching-answer').value = '';
}

function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function loadKanjiFile(level) {
    try {
        const response = await fetch(`kanji_${level}.txt`);
        const text = await response.text();
        return text.split('\n').filter(line => line.trim()).map(line => {
            const [kanji, rest] = line.split(',');
            const [pronunciation, ...meaningParts] = rest.split('-');
            var ans = null;
            if (pronunciation.includes('/')) {
                ans = pronunciation.trim().split('/');
            } else {
                ans = [pronunciation];
            }
            return {
                kanji: kanji.trim(),
                pronunciation: ans,
                meaning: meaningParts.join('-').trim()
            };
        });
    } catch (error) {
        console.error(`Error loading ${level} file:`, error);
        return [];
    }
}

async function startPractice() {
    const selectedLevels = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (selectedLevels.length === 0) {
        alert('Please select at least one level');
        return;
    }

    kanjiList = [];
    for (const level of selectedLevels) {
        const levelKanji = await loadKanjiFile(level);
        kanjiList = [...kanjiList, ...levelKanji];
    }

    if (kanjiList.length === 0) {
        alert('No kanji loaded. Please check the file paths.');
        return;
    }

    kanjiList.sort(() => Math.random() - 0.5);
    
    // Reset practice state
    currentIndex = 0;
    correctCount = 0;
    totalAttempts = 0;
    streak = 0;
    meaningShown = false;
    wrongAnswers = [];
    
    // Hide teaching area and show practice area
    document.getElementById('teaching-area').style.display = 'none';
    document.getElementById('results-area').style.display = 'none';
    document.getElementById('practice-area').style.display = 'block';
    
    closeSettings();
    showNextKanji();
    updateStats();
}

function showNextKanji() {
    if (currentIndex >= kanjiList.length) {
        alert('Practice completed! Starting over...');
        kanjiList.sort(() => Math.random() - 0.5);
        currentIndex = 0;
    }

    currentKanji = kanjiList[currentIndex];
    document.getElementById('kanji').textContent = currentKanji.kanji;
    document.getElementById('meaning').textContent = '???';
    
    // Reset buttons and input
    document.getElementById('answer').value = '';
    document.getElementById('result').textContent = '';
    document.getElementById('answer').focus();
    
    // Enable/disable appropriate buttons
    document.getElementById('showMeaning').disabled = false;
    document.getElementById('checkAnswer').disabled = false;
    document.getElementById('showAnswer').disabled = false;
    document.getElementById('nextWord').disabled = true; // Disable next word initially
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer').value.trim();
    const correctAnswers = currentKanji.pronunciation;
    const correct = correctAnswers.some(answer => userAnswer === answer.trim());
    
    if (correct) {
        correctCount += meaningShown ? 0.5 : 1;
        totalAttempts++;
        streak++;
        bestStreak = Math.max(bestStreak, streak);
        document.getElementById('result').innerHTML = 
            `<span class="correct">正解! (Correct!)</span>`;
        // Disable check answer, show answer and enable next word
        document.getElementById('checkAnswer').disabled = true;
        document.getElementById('showAnswer').disabled = true;
        document.getElementById('nextWord').disabled = false;
    } else {
        if (!wrongAnswers.some(wrong => wrong.kanji === currentKanji.kanji)) {
            wrongAnswers.push({
                kanji: currentKanji.kanji,
                pronunciation: currentKanji.pronunciation,
                meaning: currentKanji.meaning,
                userAnswer: userAnswer
            });
        }
        // Call showAnswer but with a special flag to indicate it's after an incorrect attempt
        showAnswer(true);
    }
    updateStats();
    enter_checked = true;
}

function endPracticeSession() {
    // Hide practice area
    document.getElementById('practice-area').style.display = 'none';
    
    // Show and populate results area
    const resultsArea = document.getElementById('results-area');
    resultsArea.style.display = 'block';
    
    // Update final score
    const percentage = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    document.getElementById('final-score').textContent = 
        `${correctCount}/${totalAttempts} (${percentage}%)`;
    
    // Update best streak
    document.getElementById('best-streak-result').textContent = `${bestStreak}`;
    
    // Update review section
    if (wrongAnswers.length > 0) {
        document.getElementById('review-header').style.display = 'block';
        document.getElementById('wrong-answers-list').style.display = 'block';
        document.getElementById('perfect-score-message').style.display = 'none';
        
        const tableBody = document.getElementById('review-table-body');
        tableBody.innerHTML = wrongAnswers.map(wrong => `
            <tr>
                <td>${wrong.kanji}</td>
                <td>${wrong.pronunciation.join(' or ')}</td>
                <td>${wrong.userAnswer || '(no answer)'}</td>
                <td>${wrong.meaning}</td>
            </tr>
        `).join('');
    } else {
        document.getElementById('review-header').style.display = 'none';
        document.getElementById('wrong-answers-list').style.display = 'none';
        document.getElementById('perfect-score-message').style.display = 'block';
    }
}

function startNewSession() {
    // Reset all necessary variables
    correctCount = 0;
    totalAttempts = 0;
    currentStreak = 0;
    bestStreak = 0;
    wrongAnswers = [];
    
    // Hide results area
    document.getElementById('results-area').style.display = 'none';
    
    // Show mode selection if you have it
    document.getElementById('mode-selection').style.display = 'block';
}

function showMeaning() {
    document.getElementById('meaning').textContent = currentKanji.meaning;
    document.getElementById('showMeaning').disabled = true;
    meaningShown = true;
}

function showAnswer(isAfterIncorrectAttempt = false) {
    let resultMessage = isAfterIncorrectAttempt 
        ? `<span class="incorrect">不正解 (Incorrect). </span>` 
        : '';
    
    document.getElementById('result').innerHTML = 
        `${resultMessage}読み方: ${currentKanji.pronunciation}`;
    document.getElementById('meaning').textContent = currentKanji.meaning;
    totalAttempts++;
    streak = 0;
    
    // Disable all buttons except next word
    document.getElementById('showMeaning').disabled = true;
    document.getElementById('showAnswer').disabled = true;
    document.getElementById('checkAnswer').disabled = true;
    document.getElementById('nextWord').disabled = false;
    
    updateStats();
}


function nextWord() {
    currentIndex++;
    meaningShown = false; // Reset meaningShown flag
    showNextKanji();
    enter_checked = false;
}

function checkEnter(event) {
    if (event.key === 'Enter') {
        // Practice mode check enter
        if (currentMode === 'practice') {
            if (!enter_checked)
                checkAnswer();
            else
                nextWord();
        }
        // Teaching mode check enter
        if (currentMode === 'teaching') {
            if (!enter_checked)
                checkTeachingAnswer();
            else 
                nextTeachingWord();
        }
    }
}


function updateStats() {
    const percentage = totalAttempts === 0 ? 0 : 
        Math.round((correctCount / totalAttempts) * 100);
    
    document.getElementById('statsText').textContent = 
        `Score: ${correctCount}/${totalAttempts} (${percentage}%)`;
    
    document.getElementById('streakBadge').textContent = 
        `Current Streak: ${streak} | Best: ${bestStreak}`;
    
    document.getElementById('progressBar').style.width = `${percentage}%`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === document.getElementById('settingsModal')) {
        closeSettings();
    }
}
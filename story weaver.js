// Application State
        const AppState = {
            story: [],
            sessionId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userName: '',
            editingId: null
        };

        // Initial story
        const initialStory = {
            id: 1,
            text: "In a cozy cabin nestled between ancient trees, a mysterious letter arrived at dawn.",
            author: "Story Weaver",
            authorId: "system",
            timestamp: Date.now(),
            edited: false
        };

        // Initialize the app
        function initApp() {
            AppState.story.push(initialStory);
            updateStoryContext();
            updateTimeline();
            attachEventListeners();
        }

        // Attach event listeners
        function attachEventListeners() {
            const submitBtn = document.getElementById('submitBtn');
            const newStoryBtn = document.getElementById('newStoryBtn');
            const userSentence = document.getElementById('userSentence');
            const userName = document.getElementById('userName');

            submitBtn.addEventListener('click', handleSubmit);
            newStoryBtn.addEventListener('click', handleNewStory);
            userSentence.addEventListener('input', updateCharCounter);
            userName.addEventListener('input', (e) => {
                AppState.userName = e.target.value.trim();
            });
        }

        // Update character counter
        function updateCharCounter() {
            const textarea = document.getElementById('userSentence');
            const counter = document.getElementById('charCounter');
            const length = textarea.value.length;
            const maxLength = 200;

            counter.textContent = `${length}/${maxLength}`;

            if (length > maxLength * 0.9) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }

            if (length >= maxLength) {
                counter.classList.add('error');
            } else {
                counter.classList.remove('error');
            }
        }

        // Handle story submission
        function handleSubmit() {
            const textarea = document.getElementById('userSentence');
            const sentence = textarea.value.trim();

            if (!sentence) {
                alert('Please write a sentence to continue the story!');
                return;
            }

            const author = AppState.userName || 'Anonymous';
            const newEntry = {
                id: AppState.story.length + 1,
                text: sentence,
                author: author,
                authorId: AppState.sessionId,
                timestamp: Date.now(),
                edited: false
            };

            AppState.story.push(newEntry);
            textarea.value = '';
            updateCharCounter();
            updateStoryContext();
            updateTimeline();

            // Scroll to the new entry
            setTimeout(() => {
                const timeline = document.getElementById('timeline');
                timeline.scrollTop = timeline.scrollHeight;
            }, 100);
        }

        // Handle new story
        function handleNewStory() {
            if (AppState.story.length > 1) {
                const confirm = window.confirm('Are you sure you want to start a new story? All current contributions will be lost.');
                if (!confirm) return;
            }

            AppState.story = [initialStory];
            document.getElementById('userSentence').value = '';
            updateCharCounter();
            updateStoryContext();
            updateTimeline();
        }

        // Update story context (last 4 sentences)
        function updateStoryContext() {
            const contextDiv = document.getElementById('storyContext');
            const lastFour = AppState.story.slice(-4);

            if (lastFour.length === 0) {
                contextDiv.innerHTML = '<p class="context-sentence">No story yet. Be the first to start!</p>';
                return;
            }

            contextDiv.innerHTML = lastFour
                .map(entry => `<p class="context-sentence">${entry.text}</p>`)
                .join('');
        }

        // Update timeline
        function updateTimeline() {
            const timeline = document.getElementById('timeline');

            if (AppState.story.length === 0) {
                timeline.innerHTML = '<div class="empty-state">No contributions yet. Start weaving your tale!</div>';
                return;
            }

            timeline.innerHTML = AppState.story
                .map((entry, index) => createTimelineItem(entry, index))
                .join('');

            // Attach edit listeners
            attachEditListeners();
        }

        // Create timeline item HTML
        function createTimelineItem(entry, index) {
            const isAuthor = entry.authorId === AppState.sessionId;
            const editButton = isAuthor ? `<button class="btn-edit" data-id="${entry.id}">Edit</button>` : '';
            const editedLabel = entry.edited ? '<span class="edited-label">(edited)</span>' : '';
            const timeAgo = getTimeAgo(entry.timestamp);

            return `
                <div class="timeline-item" id="item-${entry.id}">
                    <div class="timeline-header-row">
                        <span class="timeline-number">#${index + 1}</span>
                        <div class="timeline-meta">
                            <span class="timeline-author">by ${entry.author}</span>
                            <span class="timeline-timestamp">${timeAgo}</span>
                        </div>
                    </div>
                    <p class="timeline-text">${entry.text}</p>
                    <div class="timeline-actions">
                        ${editButton}
                        ${editedLabel}
                    </div>
                </div>
            `;
        }

        // Get relative time
        function getTimeAgo(timestamp) {
            if (timestamp === 'story_start') return 'Story Start';

            const seconds = Math.floor((Date.now() - timestamp) / 1000);

            if (seconds < 10) return 'Just now';
            if (seconds < 60) return `${seconds} seconds ago`;

            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;

            const hours = Math.floor(minutes / 60);
            if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;

            const days = Math.floor(hours / 24);
            return days === 1 ? '1 day ago' : `${days} days ago`;
        }

        // Attach edit listeners
        function attachEditListeners() {
            const editButtons = document.querySelectorAll('.btn-edit');
            editButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    enterEditMode(id);
                });
            });
        }

        // Enter edit mode
        function enterEditMode(id) {
            const entry = AppState.story.find(e => e.id === id);
            if (!entry) return;

            AppState.editingId = id;
            const itemDiv = document.getElementById(`item-${id}`);
            itemDiv.classList.add('edit-mode');

            const editHTML = `
                <div class="timeline-header-row">
                    <span class="timeline-number">#${AppState.story.indexOf(entry) + 1}</span>
                    <div class="timeline-meta">
                        <span class="timeline-author">by ${entry.author}</span>
                        <span class="timeline-timestamp">Editing...</span>
                    </div>
                </div>
                <textarea class="edit-textarea" id="editText-${id}">${entry.text}</textarea>
                <div class="edit-buttons">
                    <button class="btn-save" data-id="${id}">Save</button>
                    <button class="btn-cancel" data-id="${id}">Cancel</button>
                </div>
            `;

            itemDiv.innerHTML = editHTML;

            // Attach save and cancel listeners
            document.querySelector(`.btn-save[data-id="${id}"]`).addEventListener('click', () => saveEdit(id));
            document.querySelector(`.btn-cancel[data-id="${id}"]`).addEventListener('click', () => cancelEdit(id));
            document.getElementById(`editText-${id}`).focus();
        }

        // Save edit
        function saveEdit(id) {
            const textarea = document.getElementById(`editText-${id}`);
            const newText = textarea.value.trim();

            if (!newText) {
                alert('Sentence cannot be empty!');
                return;
            }

            const entry = AppState.story.find(e => e.id === id);
            if (entry) {
                entry.text = newText;
                entry.edited = true;
            }

            AppState.editingId = null;
            updateStoryContext();
            updateTimeline();
        }

        // Cancel edit
        function cancelEdit(id) {
            AppState.editingId = null;
            updateTimeline();
        }

        // Initialize app on load
        initApp();s
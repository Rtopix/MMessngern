/**
 * MMessenger - Professional Chat Application
 * Clean, modular JavaScript implementation
 */

class StorageManager {
    constructor() {
        this.USER_KEY_PREFIX = 'mmessenger_user_';
        this.CURRENT_USER_KEY = 'mmessenger_user_key';
    }

    /**
     * Generate a unique 16-character key
     * @returns {string} Unique key
     */
    generateUniqueKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Save user data to localStorage
     * @param {string} userKey - User's unique key
     * @param {Object} userData - User data object
     */
    saveUserData(userKey, userData) {
        try {
            localStorage.setItem(`${this.USER_KEY_PREFIX}${userKey}`, JSON.stringify(userData));
        } catch (error) {
            console.error('Error saving user data:', error);
            throw new Error('Failed to save user data');
        }
    }

    /**
     * Load user data from localStorage
     * @param {string} userKey - User's unique key
     * @returns {Object|null} User data or null if not found
     */
    loadUserData(userKey) {
        try {
            const data = localStorage.getItem(`${this.USER_KEY_PREFIX}${userKey}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    /**
     * Get current user key from localStorage
     * @returns {string|null} Current user key or null
     */
    getCurrentUserKey() {
        return localStorage.getItem(this.CURRENT_USER_KEY);
    }

    /**
     * Set current user key in localStorage
     * @param {string} userKey - User's unique key
     */
    setCurrentUserKey(userKey) {
        localStorage.setItem(this.CURRENT_USER_KEY, userKey);
    }

    /**
     * Remove current user data
     */
    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    /**
     * Get all users from localStorage
     * @returns {Array} Array of user objects
     */
    getAllUsers() {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.USER_KEY_PREFIX)) {
                const userKey = key.replace(this.USER_KEY_PREFIX, '');
                const userData = this.loadUserData(userKey);
                if (userData && userData.username) {
                    users.push({
                        username: userData.username,
                        key: userKey
                    });
                }
            }
        }
        return users;
    }
}

class ChatManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.chats = [];
        this.friends = [];
    }

    /**
     * Initialize chats with default data
     * @returns {Array} Initial chats array
     */
    initializeChats() {
        return [{
            id: 1,
            name: 'Избранное',
            type: 'favorites',
            messages: []
        }];
    }

    /**
     * Load chats from storage
     * @param {string} userKey - User's unique key
     */
    loadChats(userKey) {
        const userData = this.storage.loadUserData(userKey);
        if (userData) {
            this.chats = userData.chats || this.initializeChats();
            this.friends = userData.friends || [];
            
            // Filter out invalid chats
            this.chats = this.chats.filter(chat => 
                chat && chat.id && chat.name
            );

            if (this.chats.length === 0) {
                this.chats = this.initializeChats();
            }
        } else {
            this.chats = this.initializeChats();
            this.friends = [];
        }
    }

    /**
     * Save chats to storage
     * @param {string} userKey - User's unique key
     * @param {string} username - Username
     */
    saveChats(userKey, username) {
        const userData = {
            username: username,
            chats: this.chats,
            friends: this.friends
        };
        this.storage.saveUserData(userKey, userData);
    }

    /**
     * Create a new chat
     * @param {string} name - Chat name
     * @param {string} description - Chat description
     * @returns {Object} New chat object
     */
    createChat(name, description = '') {
        const newChat = {
            id: Date.now(),
            name: name.trim(),
            description: description.trim(),
            messages: [],
            createdAt: new Date().toISOString()
        };
        this.chats.push(newChat);
        return newChat;
    }

    /**
     * Create a private chat with friend
     * @param {string} friendKey - Friend's unique key
     * @param {string} friendUsername - Friend's username
     * @param {string} currentUserKey - Current user's key
     * @returns {Object} New private chat object
     */
    createPrivateChat(friendKey, friendUsername, currentUserKey) {
        const newChat = {
            id: Date.now(),
            name: friendUsername,
            type: 'private',
            participants: [currentUserKey, friendKey],
            messages: [],
            createdAt: new Date().toISOString()
        };
        this.chats.push(newChat);
        return newChat;
    }

    /**
     * Find existing private chat with friend
     * @param {string} friendKey - Friend's unique key
     * @returns {Object|null} Existing chat or null
     */
    findPrivateChat(friendKey) {
        return this.chats.find(chat => 
            chat.type === 'private' && 
            chat.participants && 
            chat.participants.includes(friendKey)
        );
    }

    /**
     * Add message to chat
     * @param {Object} chat - Chat object
     * @param {string} author - Message author
     * @param {string} text - Message text
     */
    addMessage(chat, author, text) {
        if (!chat.messages) {
            chat.messages = [];
        }

        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        chat.messages.push({
            author: author,
            text: text.trim(),
            time: time,
            timestamp: now.toISOString()
        });

        // Keep only last 1000 messages for performance
        if (chat.messages.length > 1000) {
            chat.messages = chat.messages.slice(-1000);
        }
    }

    /**
     * Add friend to friends list
     * @param {string} friendKey - Friend's unique key
     * @param {string} friendUsername - Friend's username
     * @returns {boolean} True if friend was added, false if already exists
     */
    addFriend(friendKey, friendUsername) {
        if (this.friends.some(friend => friend.key === friendKey)) {
            return false;
        }

        this.friends.push({
            key: friendKey,
            username: friendUsername,
            addedAt: new Date().toISOString()
        });
        return true;
    }

    /**
     * Search users by username
     * @param {string} searchTerm - Search term
     * @param {string} currentUserKey - Current user's key to exclude from results
     * @returns {Array} Filtered users array
     */
    searchUsers(searchTerm, currentUserKey) {
        const allUsers = this.storage.getAllUsers();
        const filteredUsers = allUsers.filter(user => 
            user.key !== currentUserKey &&
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filteredUsers;
    }
}

class UIManager {
    constructor() {
        this.currentScreen = null;
        this.typingTimeout = null;
        this.isTyping = false;
    }

    /**
     * Show specific screen with animation
     * @param {string} screenId - Screen ID to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Add entrance animation
            if (window.gsap) {
                gsap.from(targetScreen, {
                    x: 100,
                    opacity: 0,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }
        }
    }

    /**
     * Show modal with animation
     * @param {string} modalId - Modal ID to show
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if (window.gsap) {
                gsap.from('.modal-content', {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.3,
                    ease: 'back.out'
                });
            }
        }
    }

    /**
     * Hide modal
     * @param {string} modalId - Modal ID to hide
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Render chat list
     * @param {Array} chats - Chats array
     */
    renderChatList(chats) {
        const list = document.getElementById('chatList');
        if (!list) {
            console.error('Chat list element not found');
            return;
        }

        list.innerHTML = '';

        if (!chats || chats.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Нет чатов</div>';
            return;
        }

        chats.forEach(chat => {
            if (!chat || !chat.id || !chat.name) return;

            const item = document.createElement('div');
            item.className = 'chat-item';
            
            const lastMsg = chat.messages && chat.messages.length > 0 
                ? chat.messages[chat.messages.length - 1] 
                : null;
            
            const chatIcon = chat.type === 'private' ? '👤' : '💬';
            const preview = lastMsg && lastMsg.text 
                ? (lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + '...' : lastMsg.text)
                : 'Нет сообщений';

            item.innerHTML = `
                <div class="chat-avatar">${chatIcon}</div>
                <div class="chat-info">
                    <div class="chat-name">${this.escapeHtml(chat.name)}</div>
                    <div class="chat-preview">${this.escapeHtml(preview)}</div>
                </div>
            `;
            
            item.onclick = () => this.onChatClick(chat);
            list.appendChild(item);
        });
    }

    /**
     * Render messages in chat
     * @param {Object} chat - Chat object
     * @param {string} currentUser - Current username
     */
    renderMessages(chat, currentUser) {
        const container = document.getElementById('messagesContainer');
        const typingIndicator = document.getElementById('typingIndicator');

        if (!container || !chat || !chat.messages) {
            console.error('Messages container or chat data not found');
            return;
        }

        // Store typing indicator state
        const typingDisplay = typingIndicator ? typingIndicator.style.display : 'none';

        // Clear existing messages
        const messages = container.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());

        // Re-add typing indicator
        if (typingIndicator && !container.contains(typingIndicator)) {
            container.appendChild(typingIndicator);
        }

        // Show last 100 messages for performance
        const messagesToShow = chat.messages.slice(-100);

        messagesToShow.forEach((msg, index) => {
            if (!msg || !msg.text || !msg.author) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.author === currentUser ? 'own' : ''}`;
            
            msgDiv.innerHTML = `
                ${msg.author !== currentUser ? `<div class="message-author">${this.escapeHtml(msg.author)}</div>` : ''}
                <div class="message-bubble">${this.escapeHtml(msg.text)}</div>
                <div class="message-time">${msg.time || '00:00'}</div>
            `;
            
            container.appendChild(msgDiv);

            // Animate last 10 messages
            if (index >= messagesToShow.length - 10 && window.gsap) {
                gsap.from(msgDiv, { opacity: 0, y: 20, duration: 0.3 });
            }
        });

        // Restore typing indicator state
        if (typingIndicator) {
            typingIndicator.style.display = typingDisplay;
        }

        // Scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    /**
     * Render friends list
     * @param {Array} friends - Friends array
     */
    renderFriendsList(friends) {
        const list = document.getElementById('friendsList');
        if (!list) return;

        list.innerHTML = '';

        if (friends.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">У вас пока нет друзей</div>';
            return;
        }

        friends.forEach(friend => {
            const item = document.createElement('div');
            item.className = 'friend-item';
            item.innerHTML = `
                <div class="friend-info">
                    <div class="friend-avatar">${friend.username[0].toUpperCase()}</div>
                    <div class="friend-details">
                        <div class="friend-name">${this.escapeHtml(friend.username)}</div>
                        <div class="friend-status online">В сети</div>
                    </div>
                </div>
                <button class="btn chat-btn" onclick="app.startChatWithFriend('${friend.key}', '${this.escapeHtml(friend.username).replace(/'/g, "\\'")}')">Чат</button>
            `;
            list.appendChild(item);
        });
    }

    /**
     * Render search results
     * @param {Array} users - Users array
     * @param {Array} friends - Current friends array
     */
    renderSearchResults(users, friends) {
        const results = document.getElementById('searchResults');
        if (!results) return;

        results.innerHTML = '';

        if (users.length === 0) {
            results.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Пользователи не найдены</div>';
            return;
        }

        users.forEach(user => {
            const isAlreadyFriend = friends.some(friend => friend.key === user.key);
            const item = document.createElement('div');
            item.className = 'search-result-item';
            
            item.innerHTML = `
                <div class="search-result-avatar">${user.username[0].toUpperCase()}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${this.escapeHtml(user.username)}</div>
                    <div class="search-result-key">${user.key}</div>
                </div>
                ${isAlreadyFriend ? 
                    '<div style="color: #4caf50; font-size: 12px;">Уже в друзьях</div>' : 
                    `<button class="btn add-friend-btn" onclick="app.addFriend('${user.key}', '${this.escapeHtml(user.username).replace(/'/g, "\\'")}')">Добавить</button>`
                }
            `;
            results.appendChild(item);
        });
    }

    /**
     * Show typing indicator
     * @param {string} username - Username who is typing
     */
    showTypingIndicator(username) {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.textContent = `${username} печатает...`;
            indicator.style.display = 'block';
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Show button feedback
     * @param {HTMLElement} button - Button element
     * @param {string} successText - Success text
     * @param {string} successColor - Success color
     */
    showButtonFeedback(button, successText, successColor) {
        const originalText = button.textContent;
        const originalColor = button.style.background;
        
        button.textContent = successText;
        button.style.background = successColor;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = originalColor;
        }, 2000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle chat click
     * @param {Object} chat - Chat object
     */
    onChatClick(chat) {
        if (this.onChatSelect) {
            this.onChatSelect(chat);
        }
    }

    /**
     * Set chat selection callback
     * @param {Function} callback - Callback function
     */
    setChatSelectCallback(callback) {
        this.onChatSelect = callback;
    }
}

class MMessengerApp {
    constructor() {
        this.storage = new StorageManager();
        this.chatManager = new ChatManager(this.storage);
        this.ui = new UIManager();
        
        this.currentUser = '';
        this.currentUserKey = '';
        this.currentChat = null;

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadUserData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Set chat selection callback
        this.ui.setChatSelectCallback((chat) => this.openChat(chat));

        // Input event listeners
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
            
            messageInput.addEventListener('input', () => this.handleTyping());
        }

        const nicknameInput = document.getElementById('nicknameInput');
        if (nicknameInput) {
            nicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveNickname();
            });
        }

        const newChatName = document.getElementById('newChatName');
        if (newChatName) {
            newChatName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.createChat();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchUsers());
        }

        const restoreKeyInput = document.getElementById('restoreKeyInput');
        if (restoreKeyInput) {
            restoreKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.restoreChats();
            });
        }

        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.currentUserKey && this.chatManager.chats.length > 0) {
                this.saveUserData();
            }
        }, 30000);

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            if (this.currentUserKey) {
                this.saveUserData();
            }
        });
    }

    /**
     * Load user data from storage
     */
    loadUserData() {
        const savedKey = this.storage.getCurrentUserKey();
        if (savedKey) {
            this.currentUserKey = savedKey;
            const userData = this.storage.loadUserData(savedKey);
            if (userData) {
                this.currentUser = userData.username;
                this.chatManager.loadChats(savedKey);
                this.ui.showScreen('chatsScreen');
                this.ui.renderChatList(this.chatManager.chats);
                return;
            }
        }
        this.ui.showScreen('welcomeScreen');
    }

    /**
     * Save user data to storage
     */
    saveUserData() {
        if (this.currentUserKey && this.currentUser) {
            this.chatManager.saveChats(this.currentUserKey, this.currentUser);
        }
    }

    /**
     * Save nickname and create user
     */
    saveNickname() {
        const input = document.getElementById('nicknameInput');
        const nickname = input.value.trim();
        
        if (!nickname) {
            alert('Введите имя пользователя!');
            return;
        }

        this.currentUser = nickname;
        this.currentUserKey = this.storage.generateUniqueKey();
        this.storage.setCurrentUserKey(this.currentUserKey);

        // Initialize user data
        this.chatManager.loadChats(this.currentUserKey);
        this.saveUserData();

        // Show chats screen with animation
        if (window.gsap) {
            gsap.to('#welcomeScreen', {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    this.ui.showScreen('chatsScreen');
                    this.ui.renderChatList(this.chatManager.chats);
                }
            });
        } else {
            this.ui.showScreen('chatsScreen');
            this.ui.renderChatList(this.chatManager.chats);
        }
    }

    /**
     * Open chat
     * @param {Object} chat - Chat object
     */
    openChat(chat) {
        if (!chat || !chat.id) {
            console.error('Invalid chat object');
            return;
        }

        this.currentChat = chat;
        const chatTitle = document.getElementById('chatTitle');
        if (chatTitle) {
            chatTitle.textContent = chat.name || 'Безымянный чат';
        }

        this.stopTyping();
        this.ui.hideTypingIndicator();
        this.ui.renderMessages(chat, this.currentUser);
        this.ui.showScreen('chatScreen');
    }

    /**
     * Send message
     */
    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text || !this.currentChat) {
            return;
        }

        try {
            this.chatManager.addMessage(this.currentChat, this.currentUser, text);
            this.saveUserData();
            this.ui.renderMessages(this.currentChat, this.currentUser);
            input.value = '';
            this.stopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Ошибка при отправке сообщения. Попробуйте еще раз.');
        }
    }

    /**
     * Go back to chats screen
     */
    backToChats() {
        this.ui.renderChatList(this.chatManager.chats);
        this.ui.showScreen('chatsScreen');
    }

    /**
     * Show new chat modal
     */
    showNewChatModal() {
        this.ui.showModal('newChatModal');
    }

    /**
     * Close modal
     */
    closeModal() {
        this.ui.hideModal('newChatModal');
        document.getElementById('newChatName').value = '';
        document.getElementById('newChatDescription').value = '';
    }

    /**
     * Create new chat
     */
    createChat() {
        const nameInput = document.getElementById('newChatName');
        const descInput = document.getElementById('newChatDescription');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Введите название канала!');
            return;
        }

        try {
            this.chatManager.createChat(name, descInput.value);
            this.saveUserData();
            this.ui.renderChatList(this.chatManager.chats);
            this.closeModal();
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Ошибка при создании канала. Попробуйте еще раз.');
        }
    }

    /**
     * Show account modal
     */
    showAccountModal() {
        document.getElementById('accountUsername').textContent = this.currentUser;
        document.getElementById('accountKey').textContent = this.currentUserKey;
        this.ui.showModal('accountModal');
    }

    /**
     * Close account modal
     */
    closeAccountModal() {
        this.ui.hideModal('accountModal');
    }

    /**
     * Copy user key to clipboard
     */
    async copyKey() {
        try {
            await navigator.clipboard.writeText(this.currentUserKey);
            const btn = document.querySelector('.copy-btn');
            this.ui.showButtonFeedback(btn, 'Скопировано!', 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)');
        } catch (error) {
            console.error('Error copying key:', error);
            alert('Не удалось скопировать ключ');
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.storage.clearCurrentUser();
        this.currentUser = '';
        this.currentUserKey = '';
        this.currentChat = null;
        this.chatManager.chats = [];
        this.chatManager.friends = [];
        this.ui.showScreen('welcomeScreen');
    }

    /**
     * Refresh chats
     */
    refreshChats() {
        try {
            this.chatManager.loadChats(this.currentUserKey);
            this.ui.renderChatList(this.chatManager.chats);
            
            const btn = event.target;
            this.ui.showButtonFeedback(btn, '✓', 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)');
        } catch (error) {
            console.error('Error refreshing chats:', error);
            alert('Ошибка при обновлении чатов. Попробуйте восстановить данные по ключу.');
        }
    }

    /**
     * Show friends modal
     */
    showFriendsModal() {
        this.closeAccountModal();
        this.ui.renderFriendsList(this.chatManager.friends);
        this.ui.showModal('friendsModal');
    }

    /**
     * Close friends modal
     */
    closeFriendsModal() {
        this.ui.hideModal('friendsModal');
    }

    /**
     * Show search modal
     */
    showSearchModal() {
        this.closeFriendsModal();
        this.ui.showModal('searchFriendsModal');
    }

    /**
     * Close search modal
     */
    closeSearchModal() {
        this.ui.hideModal('searchFriendsModal');
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    /**
     * Search users
     */
    searchUsers() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        
        if (searchTerm.length < 2) {
            document.getElementById('searchResults').innerHTML = 
                '<div style="text-align: center; padding: 20px; color: #666;">Введите минимум 2 символа</div>';
            return;
        }

        const users = this.chatManager.searchUsers(searchTerm, this.currentUserKey);
        this.ui.renderSearchResults(users, this.chatManager.friends);
    }

    /**
     * Add friend
     * @param {string} userKey - User's unique key
     * @param {string} username - Username
     */
    addFriend(userKey, username) {
        if (userKey === this.currentUserKey) {
            alert('Нельзя добавить самого себя в друзья!');
            return;
        }

        if (this.chatManager.addFriend(userKey, username)) {
            this.saveUserData();
            this.searchUsers(); // Refresh search results
            
            const btn = event.target;
            this.ui.showButtonFeedback(btn, 'Добавлен!', 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)');
        }
    }

    /**
     * Start chat with friend
     * @param {string} friendKey - Friend's unique key
     * @param {string} friendUsername - Friend's username
     */
    startChatWithFriend(friendKey, friendUsername) {
        let chat = this.chatManager.findPrivateChat(friendKey);

        if (!chat) {
            chat = this.chatManager.createPrivateChat(friendKey, friendUsername, this.currentUserKey);
            this.saveUserData();
        }

        this.closeFriendsModal();
        this.openChat(chat);
    }

    /**
     * Handle typing indicator
     */
    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.startTyping();
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    /**
     * Start typing indicator
     */
    startTyping() {
        if (!this.ui.isTyping && this.currentChat) {
            this.ui.isTyping = true;
            this.ui.showTypingIndicator(this.currentUser);
            this.simulateTypingIndicator();
        }
    }

    /**
     * Stop typing indicator
     */
    stopTyping() {
        if (this.ui.isTyping) {
            this.ui.isTyping = false;
            this.ui.hideTypingIndicator();

            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
                this.typingTimeout = null;
            }
        }
    }

    /**
     * Simulate typing from other users
     */
    simulateTypingIndicator() {
        if (this.currentChat && this.currentChat.type === 'private') {
            const otherParticipant = this.currentChat.participants.find(p => p !== this.currentUserKey);
            if (otherParticipant) {
                try {
                    const otherUserData = this.storage.loadUserData(otherParticipant);
                    if (otherUserData) {
                        setTimeout(() => {
                            if (Math.random() > 0.7) {
                                this.showTypingFromOther(otherUserData.username);
                            }
                        }, 1000 + Math.random() * 2000);
                    }
                } catch (error) {
                    console.log('Error getting user data:', error);
                }
            }
        }
    }

    /**
     * Show typing from other user
     * @param {string} username - Username who is typing
     */
    showTypingFromOther(username) {
        this.ui.showTypingIndicator(username);
        setTimeout(() => {
            this.ui.hideTypingIndicator();
        }, 2000 + Math.random() * 3000);
    }

    /**
     * Show restore modal
     */
    showRestoreModal() {
        this.closeAccountModal();
        document.getElementById('restoreKeyInput').value = '';
        this.ui.showModal('restoreChatsModal');
    }

    /**
     * Close restore modal
     */
    closeRestoreModal() {
        this.ui.hideModal('restoreChatsModal');
    }

    /**
     * Restore chats from key
     */
    restoreChats() {
        const keyInput = document.getElementById('restoreKeyInput');
        const restoreKey = keyInput.value.trim();

        if (!restoreKey) {
            alert('Введите ключ для восстановления!');
            return;
        }

        try {
            const userData = this.storage.loadUserData(restoreKey);
            if (!userData) {
                alert('Данные с таким ключом не найдены!');
                return;
            }

            if (confirm(`Восстановить данные пользователя "${userData.username}"?\nЭто заменит ваши текущие чаты и друзей.`)) {
                this.currentUserKey = restoreKey;
                this.currentUser = userData.username;
                this.chatManager.loadChats(restoreKey);
                this.storage.setCurrentUserKey(restoreKey);

                this.ui.renderChatList(this.chatManager.chats);
                this.closeRestoreModal();

                alert(`Данные успешно восстановлены!\nПользователь: ${userData.username}\nЧатов: ${this.chatManager.chats.length}\nДрузей: ${this.chatManager.friends.length}`);
            }
        } catch (error) {
            console.error('Error restoring data:', error);
            alert('Ошибка при восстановлении данных. Проверьте правильность ключа.');
        }
    }
}

// Initialize the application
const app = new MMessengerApp();

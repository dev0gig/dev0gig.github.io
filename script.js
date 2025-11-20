document.addEventListener('DOMContentLoaded', () => {
    const favoritesGrid = document.querySelector('.favorites-grid');
    const bookmarksGrid = document.querySelector('.bookmarks-grid');
    const projectList = document.querySelector('.project-list');
    const searchInput = document.querySelector('.search-bar input');

    // Edit Mode State
    let isEditMode = false;
    let currentEditId = null;
    let currentEditType = null; // 'project' or 'bookmark'

    // Default data provided by user
    const defaultData = {
        "projects": [],
        "bookmarks": []
    };

    // Load data from local storage or use default
    let appData = JSON.parse(localStorage.getItem('dashboardData')) || defaultData;

    function saveData() {
        localStorage.setItem('dashboardData', JSON.stringify(appData));
        render();
    }

    function render() {
        // Clear existing content
        favoritesGrid.innerHTML = '';
        bookmarksGrid.innerHTML = '';
        projectList.innerHTML = '';

        // Render Projects
        appData.projects.forEach((project, index) => {
            const card = createProjectCard(project, index);
            projectList.appendChild(card);
        });

        if (isEditMode) {
            const addProjectBtn = createAddButton('project');
            projectList.appendChild(addProjectBtn);
        }

        // Render Bookmarks and Favorites
        appData.bookmarks.forEach((bookmark, index) => {
            const card = createBookmarkCard(bookmark, index);

            if (bookmark.isFavorite) {
                // For favorites section, we clone but might need to handle edit events differently or just disable edit there
                // To keep it simple, we allow editing from the main list, or we can render a specific favorite card
                const favCard = createBookmarkCard(bookmark, index);
                favoritesGrid.appendChild(favCard);
            }
            bookmarksGrid.appendChild(card);
        });

        if (isEditMode) {
            const addBookmarkBtn = createAddButton('bookmark');
            bookmarksGrid.appendChild(addBookmarkBtn);
        }

        // Filter bookmarks based on search
        filterBookmarks(searchInput.value);
    }

    function getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch (e) {
            return ''; // Fallback or empty if invalid URL
        }
    }

    function createProjectCard(project, index) {
        const container = document.createElement('div');
        container.className = 'project-card-container';
        container.style.position = 'relative';

        const a = document.createElement('a');
        a.href = project.url;
        a.className = 'project-card';
        const favicon = getFaviconUrl(project.url);
        a.innerHTML = `
      <div class="project-icon"><img src="${favicon}" alt="" onerror="this.style.display='none'"></div>
      <div class="project-info">
        <span class="project-name">${project.name}</span>
      </div>
    `;

        if (isEditMode) {
            a.onclick = (e) => e.preventDefault(); // Disable link in edit mode
            const overlay = createEditOverlay('project', index);
            a.appendChild(overlay);
        }

        return a;
    }

    function createBookmarkCard(bookmark, index) {
        const a = document.createElement('a');
        a.href = bookmark.url;
        a.className = 'card';
        a.dataset.name = bookmark.name.toLowerCase(); // For search

        const favicon = getFaviconUrl(bookmark.url);

        a.innerHTML = `
      <div class="icon-placeholder"><img src="${favicon}" alt="" onerror="this.style.display='none'"></div>
      <span>${bookmark.name}</span>
    `;

        if (isEditMode) {
            a.onclick = (e) => e.preventDefault();
            const overlay = createEditOverlay('bookmark', index, bookmark.isFavorite);
            a.appendChild(overlay);
        } else {
            // Normal mode: click resets search
            a.onclick = () => {
                if (searchInput.value) {
                    searchInput.value = '';
                    filterBookmarks('');
                }
            };
        }

        return a;
    }

    function createAddButton(type) {
        const div = document.createElement('div');
        div.className = type === 'project' ? 'project-card add-new-card' : 'card add-new-card';
        div.innerHTML = '<span class="material-icons">add</span>';
        div.onclick = () => openEditModal(type, null);
        return div;
    }

    function createEditOverlay(type, index, isFavorite = false) {
        const div = document.createElement('div');
        div.className = 'edit-overlay';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<span class="material-icons" style="font-size: 14px;">edit</span>';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            openEditModal(type, index);
        };
        div.appendChild(editBtn);

        if (type === 'bookmark') {
            const favBtn = document.createElement('button');
            favBtn.className = `edit-btn favorite-btn ${isFavorite ? 'active' : ''}`;
            // favBtn.style.color = isFavorite ? 'var(--accent)' : 'white'; // Removed inline style
            favBtn.innerHTML = '<span class="material-icons" style="font-size: 14px;">star</span>';
            favBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFavorite(index);
            };
            div.appendChild(favBtn);
        }

        return div;
    }

    function filterBookmarks(query) {
        const term = query.toLowerCase();
        const cards = bookmarksGrid.querySelectorAll('.card');

        // Skip the "Add New" card if present
        cards.forEach(card => {
            if (card.classList.contains('add-new-card')) return;

            const name = card.dataset.name;
            if (name.includes(term)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // --- CRUD Operations ---

    window.toggleEditMode = () => {
        isEditMode = !isEditMode;
        // Update toggle switch state if changed from outside (e.g. exit button)
        const toggle = document.getElementById('edit-mode-toggle');
        if (toggle.checked !== isEditMode) {
            toggle.checked = isEditMode;
        }

        // Show/Hide Exit Button
        const exitBtn = document.getElementById('exit-edit-btn');
        exitBtn.style.display = isEditMode ? 'flex' : 'none';

        render();
    };

    // Hook up the toggle switch
    document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
        // Only update if state is different to avoid recursion loop if we manually set checked
        if (isEditMode !== e.target.checked) {
            window.toggleEditMode();
        }
    });

    function toggleFavorite(index) {
        appData.bookmarks[index].isFavorite = !appData.bookmarks[index].isFavorite;
        saveData();
    }

    // Modal Logic
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const deleteBtn = document.getElementById('delete-btn');
    const modalTitle = document.getElementById('modal-title');

    function openEditModal(type, index) {
        currentEditType = type;
        currentEditId = index;

        if (index === null) {
            modalTitle.textContent = 'Element hinzufügen';
            editForm.reset();
            deleteBtn.style.display = 'none';
        } else {
            modalTitle.textContent = 'Element bearbeiten';
            const item = type === 'project' ? appData.projects[index] : appData.bookmarks[index];
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-url').value = item.url;
            deleteBtn.style.display = 'block';
        }

        editModal.style.display = 'block';
    }

    // Close Edit Modal
    document.querySelector('.close-edit-modal').onclick = () => {
        editModal.style.display = 'none';
    };

    // Form Submit
    editForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('edit-name').value;
        const url = document.getElementById('edit-url').value;

        const newItem = { name, url, icon: 'link' }; // Default icon, could be enhanced

        if (currentEditId === null) {
            // Add
            if (currentEditType === 'project') {
                appData.projects.push(newItem);
            } else {
                newItem.isFavorite = false;
                appData.bookmarks.push(newItem);
            }
        } else {
            // Edit
            if (currentEditType === 'project') {
                appData.projects[currentEditId].name = name;
                appData.projects[currentEditId].url = url;
            } else {
                // Preserve favorite status
                newItem.isFavorite = appData.bookmarks[currentEditId].isFavorite;
                appData.bookmarks[currentEditId] = newItem;
            }
        }

        saveData();
        editModal.style.display = 'none';
    };

    // Delete Item
    deleteBtn.onclick = () => {
        if (confirm('Möchtest du dieses Element wirklich löschen?')) {
            if (currentEditType === 'project') {
                appData.projects.splice(currentEditId, 1);
            } else {
                appData.bookmarks.splice(currentEditId, 1);
            }
            saveData();
            editModal.style.display = 'none';
        }
    };

    // Search Event Listener
    searchInput.addEventListener('input', (e) => {
        filterBookmarks(e.target.value);
    });

    // Export Functionality
    window.exportData = () => {
        const dataStr = JSON.stringify(appData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'dashboard-data.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Import Functionality
    window.importData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    const parsedData = JSON.parse(content);
                    if (parsedData.projects && parsedData.bookmarks) {
                        appData = parsedData;
                        saveData();
                        alert('Daten erfolgreich importiert!');
                    } else {
                        alert('Ungültiges JSON-Format.');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Fehler beim Importieren der Datei.');
                }
            }
        };
        input.click();
    };

    // Settings Modal Logic
    const settingsModal = document.getElementById("settings-modal");
    const settingsBtn = document.getElementById("settings-btn");
    const closeSettings = document.querySelector("#settings-modal .close-modal");

    settingsBtn.onclick = function () {
        settingsModal.style.display = "block";
    }

    closeSettings.onclick = function () {
        settingsModal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == settingsModal) {
            settingsModal.style.display = "none";
        }
        if (event.target == editModal) {
            editModal.style.display = "none";
        }
    }

    // Initial Render
    render();
});

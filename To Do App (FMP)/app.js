// --- 1. CONFIGURATION AND INITIALIZATION ---
var firebaseConfig = {
    apiKey: "AIzaSyDXQjmXJczPiv16T4pxWVUZpNngASQQ2fc",
    authDomain: "to-do-app-2f0d3.firebaseapp.com",
    databaseURL: "https://to-do-app-2f0d3-default-rtdb.firebaseio.com",
    projectId: "to-do-app-2f0d3",
    storageBucket: "to-do-app-2f0d3.firebasestorage.app",
    messagingSenderId: "24922669979",
    appId: "1:24922669979:web:641660a0f5be18a721173e"
};

// Initialize Firebase App and Services
var app = firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// DOM References
var list = document.getElementById('list');

// **CRITICAL VARIABLE**: The device-specific database reference
var deviceTodoRef; 

// --- 2. DEVICE ID MANAGEMENT (New Logic) ---

/**
 * Gets or creates a unique Device ID from Local Storage.
 * This ID is used to scope the Firebase data to this specific browser/device.
 * @returns {string} The unique device ID.
 */
function getDeviceId() {
    let deviceId = localStorage.getItem('todoAppDeviceId');
    
    if (!deviceId) {
        // Generate a new unique ID (e.g., using a short random string)
        deviceId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('todoAppDeviceId', deviceId);
    }
    return deviceId;
}

// Initialize the device-specific reference once the app loads
const DEVICE_ID = getDeviceId();
// **CRITICAL CHANGE**: The data path is now 'todos/{DEVICE_ID}'
deviceTodoRef = db.ref('todos/' + DEVICE_ID); 

// --- 3. DATABASE LISTENERS (Updated to use deviceTodoRef) ---

// Listener for item additions
deviceTodoRef.on('child_added', function(snapshot) {
    var key = snapshot.key;
    var data = snapshot.val();
    
    // Check if the element already exists to prevent duplicates on re-initialization
    if (!document.querySelector(`[data-key="${key}"]`)) { 
        var liElement = createLiElement(key, data.text, data.completed);
        list.appendChild(liElement);
    }
});

// Listener for item removal
deviceTodoRef.on('child_removed', function(snapshot) {
    var key = snapshot.key;
    var liToRemove = document.querySelector(`[data-key="${key}"]`);
    if (liToRemove) {
        liToRemove.remove();
    }
});

// Listener for updates
deviceTodoRef.on('child_changed', function(snapshot) {
    var key = snapshot.key;
    var data = snapshot.val();
    var liToUpdate = document.querySelector(`[data-key="${key}"]`);
    
    if (liToUpdate) {
        var textSpan = liToUpdate.querySelector('.task-text');
        var checkbox = liToUpdate.querySelector('.task-checkbox');
        var editBtn = liToUpdate.querySelector('.edit-btn');

        textSpan.textContent = data.text;
        checkbox.checked = data.completed;

        // Reapply completion styles
        if (data.completed) {
            textSpan.style.textDecoration = 'line-through';
            textSpan.style.color = 'gray';
            editBtn.disabled = true;
            editBtn.style.opacity = '0.5';
        } else {
            textSpan.style.textDecoration = 'none';
            textSpan.style.color = 'black';
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
        }
    }
});


// --- 4. DOM ELEMENT CREATION (Unchanged) ---

// Function to create a list item (li) element 
function createLiElement(key, taskText, isCompleted) {
    // Create list item
    var liElement = document.createElement('li');
    liElement.classList.add('task-item');
    liElement.setAttribute('data-key', key); 

    // Create checkbox
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = isCompleted; 
    checkbox.onclick = function () {
        toggleTaskStatus(this, key); 
    };
    liElement.appendChild(checkbox);

    // Create text span
    var taskTextSpan = document.createElement('span');
    taskTextSpan.classList.add('task-text');
    taskTextSpan.textContent = taskText;
    liElement.appendChild(taskTextSpan);

    if (isCompleted) {
        taskTextSpan.style.textDecoration = 'line-through';
        taskTextSpan.style.color = 'gray';
    }

    // DELETE BUTTON
    var delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.classList.add('action-btn', 'delete-single-btn');
    delBtn.setAttribute('onclick', 'deleteSingleTodo(this)');
    liElement.appendChild(delBtn);

    // EDIT BUTTON
    var editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('action-btn', 'edit-btn');
    editBtn.setAttribute('onclick', 'editTodo(this)');
    
    // Disable edit 
    if (isCompleted) {
        editBtn.disabled = true;
        editBtn.style.opacity = '0.5';
    }
    liElement.appendChild(editBtn);

    return liElement;
}


// --- 5. CRUD OPERATIONS (Updated to use deviceTodoRef) ---

// 1. CREATE (ADD)
function addTodo() {
    var input = document.getElementById('todoInput');
    var taskText = input.value.trim();

    if (taskText === "") {
        Swal.fire({icon: 'warning', title: 'Cant Add Empty Task', text: 'Please add a task first!', timer: 2000, showConfirmButton: false});
        return; 
    }

    // Use deviceTodoRef
    deviceTodoRef.push({
        text: taskText,
        completed: false
    }).then(() => {
        input.value = ""; 
        Swal.fire({icon: 'success', title: 'Task Added!', showConfirmButton: false, timer: 1500});
    }).catch(error => {
        console.error("Error adding task:", error);
        Swal.fire({icon: 'error', title: 'Error', text: 'Could not save task.'});
    });
}


// 2. EDIT (UPDATE) 
function editTodo(e) {
    var liElement = e.parentNode;
    var key = liElement.getAttribute('data-key');
    var currentTextElement = liElement.querySelector('.task-text');
    var currentText = currentTextElement ? currentTextElement.textContent : "";
    
    if (liElement.querySelector('.task-checkbox').checked) {
        Swal.fire({icon: 'info', title: 'Task Completed', text: 'Cannot edit a completed task.', timer: 2000, showConfirmButton: false});
        return;
    }

    Swal.fire({
        title: "Edit Task",
        input: "text",
        inputValue: currentText, 
        inputPlaceholder: "Enter updated value",
        showCancelButton: true,
        confirmButtonText: "Update",
        cancelButtonText: "Cancel",
        inputValidator: (value) => {
            if (!value || value.trim() === "") {
                return 'You need to write something to update the task!';
            }
        },
    }).then((result) => {
        if (result.isConfirmed) {
            var newText = result.value.trim();
            if (key) {
                // Use deviceTodoRef
                deviceTodoRef.child(key).update({
                    text: newText
                })
                .then(() => {
                    Swal.fire({icon: 'success', title: 'Task Updated!', showConfirmButton: false, timer: 1500});
                })
                .catch(error => {
                    console.error("Error updating task:", error);
                    Swal.fire({icon: 'error', title: 'Error', text: 'Could not update task.'});
                });
            }
        }
    });
}

// 3. DELETE SINGLE
function deleteSingleTodo(e) {
    var liElement = e.parentNode;
    var key = liElement.getAttribute('data-key');

    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            if (key) {
                // Use deviceTodoRef
                deviceTodoRef.child(key).remove()
                .then(() => {
                    Swal.fire({icon: 'success', title: 'Deleted!', text: 'Your task has been deleted.', showConfirmButton: false, timer: 1500});
                })
                .catch(error => {
                    console.error("Error deleting task:", error);
                    Swal.fire({icon: 'error', title: 'Error', text: 'Could not delete task.'});
                });
            } else {
                liElement.remove();
            }
        }
    });
}

// 4. TOGGLE STATUS (UPDATE)
function toggleTaskStatus(checkbox, key) {
    var isCompleted = checkbox.checked;
    var liKey = key || checkbox.parentNode.getAttribute('data-key');

    if (liKey) {
        // Use deviceTodoRef
        deviceTodoRef.child(liKey).update({
            completed: isCompleted
        })
        .then(() => {
            Swal.fire({toast: true, position: 'top-end', icon: 'info', title: `Task marked as ${isCompleted ? 'Completed' : 'Pending'}!`, showConfirmButton: false, timer: 1500, timerProgressBar: true});
        })
        .catch(error => {
            console.error("Error toggling status:", error);
            Swal.fire({icon: 'error', title: 'Error', text: 'Could not update status.'});
        });
    } else {
       // Fallback for UI if no key
        var liElement = checkbox.parentNode;
        var text = liElement.querySelector('.task-text');
        var editBtn = liElement.querySelector('.edit-btn');
        if (isCompleted) {
            text.style.textDecoration = 'line-through';
            text.style.color = 'gray';
            editBtn.disabled = true;
            editBtn.style.opacity = '0.5';
        } else {
            text.style.textDecoration = 'none';
            text.style.color = 'black';
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
        }
    }
}

// 5. DELETE ALL
function deleteAllTodos() {
    if (list.children.length === 0) {
        Swal.fire({icon: 'info', title: 'Nothing to Delete', text: 'No tasks to delete!', timer: 2000, showConfirmButton: false});
        return;
    }

    Swal.fire({
        title: 'Delete All Tasks?',
        text: "Are you sure you want to delete ALL tasks permanently? This cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete all!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Use deviceTodoRef
            deviceTodoRef.remove()
            .then(() => {
                list.innerHTML = ""; 
                Swal.fire({icon: 'success', title: 'All Tasks Deleted!', showConfirmButton: false, timer: 1500});
            })
            .catch(error => {
                console.error("Error deleting all tasks:", error);
                Swal.fire({icon: 'error', title: 'Error', text: 'Could not delete all tasks.'});
            });
        }
    });
}
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDXQjmXJczPiv16T4pxWVUZpNngASQQ2fc",
    authDomain: "to-do-app-2f0d3.firebaseapp.com",
    databaseURL: "https://to-do-app-2f0d3-default-rtdb.firebaseio.com",
    projectId: "to-do-app-2f0d3",
    storageBucket: "to-do-app-2f0d3.firebasestorage.app",
    messagingSenderId: "24922669979",
    appId: "1:24922669979:web:641660a0f5be18a721173e"
};

// Initialize Firebase
var app = firebase.initializeApp(firebaseConfig);
var db = firebase.database();


var todoRef = db.ref('todos'); // Ref to the 'todos' node in firbase database

// Ref to the <ul> element with id="list" in firebase database
var list = document.getElementById('list');


// Function to create a list item (li) element 
function createLiElement(key, taskText, isCompleted) {
    // Create list item
    var liElement = document.createElement('li');
    liElement.classList.add('task-item');
    liElement.setAttribute('data-key', key); // Store Firebase key on the element

    // Create checkbox
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = isCompleted; // Set status from Firebase
    checkbox.onclick = function () {
        toggleTaskStatus(this, key); // Pass the key for database update
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


todoRef.on('child_added', function(snapshot) {
    var key = snapshot.key;
    var data = snapshot.val();

    // Check if the element already exists get that value
    if (!document.querySelector(`[data-key="${key}"]`)) {
        var liElement = createLiElement(key, data.text, data.completed);
        list.appendChild(liElement);
    }
});

// Listener for item removal from Firebase
todoRef.on('child_removed', function(snapshot) {
    var key = snapshot.key;
    var liToRemove = document.querySelector(`[data-key="${key}"]`);
    if (liToRemove) {
        liToRemove.remove();
    }
});

// Listener for updates in Firebase
todoRef.on('child_changed', function(snapshot) {
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


// --- CRUD OPERATIONS ---

// 1. CREATE (ADD)
function addTodo() {
    var input = document.getElementById('todoInput');
    var taskText = input.value.trim();

    if (taskText === "") {
        // Swal Alert: Empty input validation
        Swal.fire({
            icon: 'warning',
            title: 'Cant Add Empty Task',
            text: 'Please add a task first!',
            timer: 2000,
            showConfirmButton: false
        });
        return; 
    }

    // Save the new todo item to Firebase RTDB
    todoRef.push({
        text: taskText,
        completed: false
    }).then(() => {
        // UI update happens automatically via 'child_added' listener.
        input.value = ""; // Clear input
        // Swal Alert: Success
        Swal.fire({
            icon: 'success',
            title: 'Task Added!',
            showConfirmButton: false,
            timer: 1500
        });
    }).catch(error => {
        console.error("Error adding task:", error);
        // Swal Alert: Error
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Could not save task.',
        });
    });
}


// 2. EDIT (UPDATE) - **MODIFIED TO USE SweetAlert2**
function editTodo(e) {
    var liElement = e.parentNode;
    var key = liElement.getAttribute('data-key');
    var currentTextElement = liElement.querySelector('.task-text');
    var currentText = currentTextElement ? currentTextElement.textContent : "";
    
    // Check if the task is completed before editing
    if (liElement.querySelector('.task-checkbox').checked) {
        Swal.fire({
            icon: 'info',
            title: 'Task Completed',
            text: 'Cannot edit a completed task.',
            timer: 2000,
            showConfirmButton: false
        });
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
                // Update the value in Firebase database
                todoRef.child(key).update({
                    text: newText
                })
                .then(() => {
              
                    Swal.fire({
                        icon: 'success',
                        title: 'Task Updated!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                })
                .catch(error => {
                    console.error("Error updating task:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Could not update task.',
                    });
                });
            }
        }
    });
}

// 3. DELETE SINGLE
function deleteSingleTodo(e) {
    var liElement = e.parentNode;
    var key = liElement.getAttribute('data-key');

    // SweetAlert2 Confirmation
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
                todoRef.child(key).remove()
                .then(() => {
                    // UI removal handled by 'child_removed' listener
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Your task has been deleted.',
                        showConfirmButton: false,
                        timer: 1500
                    });
                })
                .catch(error => {
                    console.error("Error deleting task:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Could not delete task.',
                    });
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
    var liElement = checkbox.parentNode;
    var liKey = key || liElement.getAttribute('data-key');

    if (liKey) {
        // Update the 'completed' status in Firebase database
        todoRef.child(liKey).update({
            completed: isCompleted
        })
        .then(() => {
         
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: `Task marked as ${isCompleted ? 'Completed' : 'Pending'}!`,
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true
            });
        })
        .catch(error => {
            console.error("Error toggling status:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not update status.',
            });
        });
    } else {
      
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
    // Check if the list is empty 
    if (list.children.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Nothing to Delete',
            text: 'No tasks to delete!',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    // SweetAlert2 Confirmation
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
            // Remove the entire 'todos' node from Firebase
            todoRef.remove()
            .then(() => {
                // UI removal handled by the listeners, but we clear it to be safe
                list.innerHTML = ""; 
                Swal.fire({
                    icon: 'success',
                    title: 'All Tasks Deleted!',
                    showConfirmButton: false,
                    timer: 1500
                });
            })
            .catch(error => {
                console.error("Error deleting all tasks:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not delete all tasks.',
                });
            });
        }
    });
}

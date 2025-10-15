// Get a reference to the <ul> element with id="list"
var list = document.getElementById('list');

function addTodo() {
    var input = document.getElementById('todoInput');
    if (input.value.trim() === "") return; // Don't add empty tasks

    // Create list item
    var liElement = document.createElement('li');
    liElement.classList.add('task-item');

    // Create checkbox
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.onclick = function () {
        toggleTaskStatus(this);
    };
    liElement.appendChild(checkbox);

    // Create text span
    var taskTextSpan = document.createElement('span');
    taskTextSpan.classList.add('task-text');
    taskTextSpan.textContent = input.value;
    liElement.appendChild(taskTextSpan);

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
    liElement.appendChild(editBtn);

    list.appendChild(liElement);
    input.value = ""; // Clear input
}

function deleteAllTodos() {
    list.innerHTML = "";
}

function deleteSingleTodo(e) {
    e.parentNode.remove();
}

function editTodo(e) {
    var currentTextElement = e.parentNode.querySelector('.task-text');
    var currentText = currentTextElement ? currentTextElement.textContent : "";
    var updateVal = prompt("Enter updated value", currentText);

    if (updateVal !== null && updateVal.trim() !== "") {
        currentTextElement.textContent = updateVal.trim();
    }
}

// ✅ Checkbox functionality
function toggleTaskStatus(checkbox) {
    var li = checkbox.parentNode;
    var text = li.querySelector('.task-text');
    var editBtn = li.querySelector('.edit-btn');
    var delBtn = li.querySelector('.delete-single-btn');

    if (checkbox.checked) {
        text.style.textDecoration = 'line-through';
        text.style.color = 'gray';
        editBtn.disabled = true;
        editBtn.style.opacity = '0.5';
        
    } else {
        text.style.textDecoration = 'none';
        text.style.color = 'black';
        editBtn.disabled = false;
        delBtn.disabled = false;
        editBtn.style.opacity = '1';
        delBtn.style.opacity = '1';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const terminalInput = document.getElementById('terminal-input');
    const codeEditor = document.getElementById('code-editor');
    const runButton = document.getElementById('run-python');
    const terminal = document.getElementById('terminal');

    if (terminalInput) {
        terminalInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const input = this.value.trim();
                if (input) {
                    window.electronAPI.sendTerminalInput(input);
                    displayMessage(input, 'input');
                }
                this.value = '';
            }
        });
    }

    if (runButton && codeEditor) {
        runButton.addEventListener('click', function () {
            const code = codeEditor.value;
            window.electronAPI.runPython(code);
        });
    }

    window.electronAPI.onTerminalOutput((output) => {
        displayMessage(output.message, output.type);
    });

    function displayMessage(message, type) {
        if (!terminal) return;

        const messageElement = document.createElement('pre');
        messageElement.textContent = message;

        if (type === 'error') {
            messageElement.style.color = 'red';
        } else if (type === 'stderr') {
            messageElement.style.color = 'yellow';
        } else if (type === 'input') {
            messageElement.style.color = '#00bcd4'; // Different color for user input
        }

        terminal.appendChild(messageElement);
        terminal.scrollTop = terminal.scrollHeight;
    }
});

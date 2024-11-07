document.addEventListener('DOMContentLoaded', () => {
    const dataTypeSelect = document.getElementById('dataTypeSelect');

    // Force focus on the select element to trigger its dropdown behavior
    dataTypeSelect.addEventListener('click', () => {
        dataTypeSelect.focus();
    });
});
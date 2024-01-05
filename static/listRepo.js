fetch('/getRepos', {
method: 'GET'
})
.then(response => response.json())
.then(data => {
    data.forEach(item => {
        const link = document.createElement('a');
        link.href = '/repo/'+item;
        link.textContent = item;
        document.body.appendChild(link);
        document.body.appendChild(document.createElement('br'));
    });
})
.catch(error => {
    // Handle any errors
});
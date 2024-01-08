fetch('/getRepos', {
method: 'GET'
})
.then(response => response.json())
.then(data => {
    Object.keys(data).forEach(item => {
        repoName = item;
        toBeAnnotatedSize = data[repoName]["toBeAnnotated"];
        annotatedSize = data[repoName]["annotated"];
        const link = document.createElement('a');
        link.href = '/repo/'+repoName;
        link.textContent = repoName + "\t" + `(${annotatedSize}/${toBeAnnotatedSize})`;
        document.body.appendChild(link);
        document.body.appendChild(document.createElement('br'));
    });
})
.catch(error => {
    console.log(error);
});
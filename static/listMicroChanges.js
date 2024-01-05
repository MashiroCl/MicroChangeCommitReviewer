const repo = document.title;

async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}

function createElement(tag, textContent) {
    const element = document.createElement(tag);
    element.textContent = textContent;
    return element;
}

function createLinkElement(href, textContent) {
    const linkElement = createElement("a", textContent);
    linkElement.href = href;
    return linkElement;
}

function createForm(obj) {
    var form = document.createElement("form");
    var dropDownContainer = document.createElement("div");
    // Create a label for the dropdown
    var label = document.createElement("label");
    label.textContent = `Dropdown for micro-change types, choose "other" to add new one`;
    var otherInput = createNewTypeInput();
    var microChangeType = createDropdown(otherInput, obj.previous.name);
    dropDownContainer.appendChild(label);
    dropDownContainer.appendChild(microChangeType);
    dropDownContainer.appendChild(otherInput);
    form.appendChild(dropDownContainer);


    var microChangeIntent = createInput("Intent", obj.previous.intent);
    form.appendChild(microChangeIntent);

    var motivation = createInput("Motivation", obj.previous.motivation);
    form.appendChild(motivation);


    var microChangeStructure = createInput("Structure", obj.previous.structure);
    form.appendChild(microChangeStructure);

    var alsoKnownAs = createInput("alsoKnownAs", obj.previous.alsoKnownAs);
    form.appendChild(alsoKnownAs);

    var howToDetect = createInput("howToDetect", obj.previous.howToDetect);
    form.appendChild(howToDetect);

    var behaviourChange = createInput("behaviourChange", obj.previous.behaviourChange);
    form.appendChild(behaviourChange);

    var goodExample = createInput("goodExample", obj.previous.goodExample);
    form.appendChild(goodExample);    

    var submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit";
    form.appendChild(submitButton);


    function getFormData(){
        return{
            intent: microChangeIntent,
            motivation: motivation,
            structure: microChangeStructure,
            behaviourChange: behaviourChange,
            goodExample: goodExample,
            alsoKnownAs: alsoKnownAs,
            howToDetect: howToDetect,
            microChangeType:  microChangeType,
            otherInput: otherInput
        };
    }

    return { form: form, getFormData: getFormData };
}

function createInput(inputName, existData){
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = inputName;
    if(existData){
        input.value = existData;
    }
    return input;
}

async function fetchRefactoringData(repo, commitID) {
    try {
        const response = await fetch(`/repo/${repo}/RM/${commitID}`);
        const data = await response.json();
        return data["commits"][0]["refactorings"];
    } catch (error) {
        console.error("Error fetching RM detection status:", error);
    }
}

function createDropdown(inputOther, previousName){
    var dropdown = document.createElement("select");
    loadMicroChangeTypes();
    var existingItems = JSON.parse(localStorage.getItem("data")) || [];
    // load the existed selection data
    dropdown.innerHTML = "";

    // Add existing items to the dropdown
    existingItems.forEach(function(item) {
    var option = document.createElement("option");
    option.value = item;
    option.text = item;
    dropdown.add(option);
    });

        // Add the "Other" option
    var otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.text = "Other";
    dropdown.add(otherOption);

    addEventListenerForDropdown(dropdown, inputOther);
    if(previousName){
        dropdown.value = previousName;
    }

    return dropdown;
}

function addEventListenerForDropdown(dropdown, otherInput) {
    dropdown.addEventListener("change", function () {
        if (dropdown.value === "other") {
            otherInput.style.display = "block";
        } else {
            otherInput.style.display = "none";
        }
    });
}


function saveNewItem(newInput) {
    // Retrieve existing items from localStorage
    var existingItems = JSON.parse(localStorage.getItem("data")) || [];

    // Add the new item to the list
    existingItems.push(newInput.value);

    // Save the updated list back to localStorage
    localStorage.setItem("data", JSON.stringify(existingItems));

    // Send the data to the Flask backend
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/save_micro_change_types', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log('Data saved successfully!');
            } else {
                console.error('Failed to save data. Status:', xhr.status);
            }
        }
    };

    xhr.send(JSON.stringify({ data: existingItems }));
    // Reset the input and refresh the dropdown with the updated list
    return createDropdown(newInput, newInput.value);
}


async function main(){
    try{
        const data = await fetchData(`/repo/${repo}/show`);

        for(const obj of data){
            const container = document.createElement("div");

            const commitID = obj.commitID;
            const message = obj.message;
            const link = obj.link;
            const changeStatus = obj.change_status;
            const RM = obj.refactoringminer;

            const messageElement = createElement("p", `Message: ${message}`);
            container.appendChild(messageElement);

            const gitLink = createLinkElement(link, `Diff: ${link}`);
            container.appendChild(gitLink);

            const changeStatusElement = createElement("p", `Change Status: ${changeStatus}`);
            container.appendChild(changeStatusElement);

            const RMlink = createLinkElement(`/repo/${repo}/RM/${RM}`, `RM: ${RM}`);
            container.appendChild(RMlink);

            const formObject = createForm(obj);
            const form = formObject.form;
            const formData = formObject.getFormData();

            const RMDetect = createInput("RM", obj.previous.refactoringminer);


            if (!obj.previous.refactoringminer) {
                const refDetected = await fetchRefactoringData(repo, commitID);
                RMDetect.value = refDetected.length > 0 ? refDetected.map(item => item["type"]) : "Not detected";
            }


            form.appendChild(RMDetect);
            // Add event listener to form submit button

            form.addEventListener("submit", async function(event) {
                event.preventDefault(); // Prevent form submission
                var microChangeName = formData.microChangeType;
                if(formData.otherInput.value.length>0){
                    microChangeName = formData.otherInput.value;
                    saveNewItem(formData.otherInput);
                }
                // Create payload object
                var payload = {
                    commitID: commitID,
                    name: microChangeName,
                    intent: formData.intent.value,
                    motivation: formData.motivation.value,
                    structure: formData.structure.value,
                    refactoringminer: RMDetect.value,
                    behaviourChange: formData.behaviourChange.value,
                    goodExample: formData.goodExample.value,
                    alsoKnownAs: formData.alsoKnownAs.value,
                    howToDetect: formData.howToDetect.value
                };
                fetch(`/repo/${repo}/record`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                })
                .then(response => response.json())
                .catch(error => {
                    console.error('Error:', error);
                });
            });

            container.appendChild(form);

            // Append the container to the body
            document.body.appendChild(container);

        }
    }
    catch (error){
        console.log(error);
    }
}


function createNewTypeInput(){
    // show an input and a button if the dropdown is selected the "other" option
    var input = document.createElement("input");
    input.type ="text";
    input.placeholder = "new micro-change type";
    input.style.display = "none";
    var newDropDown = null;
    return input;
}

function loadMicroChangeTypes(){
    fetch('/get_micro_change_types')
        .then(response => response.json())
        .then(data => {
        localStorage.setItem('data', JSON.stringify(data));
        })
        .catch(error => console.error('Error fetching dropdown items:', error));
}

function checkNewOption(dropdown) {
    var newItemInput = document.getElementById("newItemInput");

    if (dropdown.value === "other") {
    newItemInput.style.display = "block";
    } else {
    newItemInput.style.display = "none";
    }
}

main()


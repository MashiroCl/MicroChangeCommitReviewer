from flask import Flask, request, render_template, session, jsonify
import pathlib
import json
from mircochange import MicroChangeCommit

app = Flask(__name__, static_url_path="/static")

LocalRepositoryPath = "/Users/leichen/project/semantic_lifter/SemanticLifter/micro-change-reviewer/data"

@app.route('/')
def repo_list():
    return render_template('repo-list.html')


@app.route('/getRepos', methods=['GET'])
def get_repos_list():
    path = pathlib.Path("./data/")
    folders = [folder.name for folder in path.iterdir() if folder.is_dir()]
    return jsonify(folders)


@app.route('/repo/<name>', methods=['GET'])
def repo_page(name):
    return render_template('micro-changes.html', name=name)


def load_repo_data(name, commitID):
    path = pathlib.Path(f"./record/{name}/{commitID}.json")
    data = None
    if path.exists():
        with open(str(path)) as f:
            data = json.load(f)
    print("the loaded data is ", data)
    return data

@app.route('/repo/<name>/show', methods=['GET'])
def show_repo(name):
    path = pathlib.Path(f"./data/{name}")
    # load commits
    with open(str(path.joinpath("withinmethod_refactor_commits.json"))) as f:
        data = json.load(f)
    
    # find the github commit link
    githublink = ""
    with open("./WhyWeRefactor.txt") as f:
        lines = f.readlines()
        for eachline in lines:
            if name.split("_methodlevel")[0] in eachline:
                githublink = eachline.split(".git")[0]+"/commit/"
                break

    for each in data:
        each["commitID"] = each["notes"]
        each["link"] = githublink+each["notes"]
        each["refactoringminer"] = each["notes"]

        # if the info has been recorded before, fill in the inputs
        previous_repo_data = load_repo_data(name, each["commitID"])
        if previous_repo_data:
            each["name"] = previous_repo_data["name"]
            each["previous"] = previous_repo_data
        else:
            each["previous"] = {}

    return jsonify(data)

@app.route('/repo/<name>/record', methods=['POST'])
def record_repo(name):
    print("recording")
    path = pathlib.Path(f"./record/{name}")
    path.mkdir(exist_ok=True)
    data = request.get_json()
    print("data",data)
    micro_change_commit = MicroChangeCommit(data)
    micro_change_commit.dump(str(path.joinpath(micro_change_commit.commitID+".json")))
    return jsonify({"message": "Recorded successfully"}) 

@app.route('/repo/<name>/RM/<commit>', methods=['GET'])
def check_RM(name, commit):
    path = pathlib.Path(f"./data/{name}").joinpath("RM", commit+".json")
    data = None
    if path.exists():
        with open(str(path)) as f:
            data = json.load(f)
    if data and data["commits"] and len(data["commits"][0]["refactorings"])>0:
        data["detected"] = True
    return jsonify(data)

def get_dropdown_items():
    with open('micro-change-types.json', 'r') as file:
        data = json.load(file)
    return data

@app.route('/get_micro_change_types', methods=['GET'])
def get_dropdown_items_route():
    dropdown_items = get_dropdown_items()
    return jsonify(dropdown_items["data"])

@app.route('/save_micro_change_types', methods=['POST'])
def save_data():
    try:
        data = request.get_json()
        print(data)
        with open('./micro-change-types.json', 'w') as f:
            json.dump(data,f)
        # You can respond with a success message
        return jsonify({'message': 'Data saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()

import json


class MicroChangeCommit:
    def __init__(self, data) -> None:
        self.commitID = data["commitID"]
        self.name = data["name"]
        self.intent = data["intent"]
        self.motivation = data["motivation"]
        self.refacotoringminer=data["refactoringminer"]
        self.structure = data["structure"]
        self.alsoKnownAs = data["alsoKnownAs"]
        self.howToDetect = data["howToDetect"]
        self.goodExample = data["goodExample"]
        self.behaviourChange = data["behaviourChange"]
        # self.coChange = data["coChange"]
    
    def dump(self, path): 
        with open(path, "w") as f:
            json.dump(self.__dict__, f)



    
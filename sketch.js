var score = 0;
var questionCount = 0; //counts how many questions from the active category have been answered

//Names of the different categories available: MORE TBA SOON
var categories = ["General", "Random", "Animals", "Geography", "History", "Movies", "Music", "Math", "Pop Culture", "Science", "Sports", "Television"];

var selectedAnswer = -1; //which answer is currently selected, -1 is nil

let questionsAnswers = []; // array of Question objects which store all trivia content per round (question, correct answer, three other wrong answers)

var screen = 0; //each number corresponds to a game screen (0=homepage, 1=activegame, 2=gameover, 3=settings)

var triviaAPI; //API

//Button Objects
var answerButtonArray = []; //ANSWER BUTTON ARRAY, stores X and Y coordinates of each answer button 
var categoryButtonArray = []; //CATEGORY BUTTON ARRAY, stores X and Y coordinates of each category button 
var submitButton;           //Submit Button object, stores X and Y coordinates of submit button
var homeButton;             //Home Button object, stores X and Y coordinates of home button
var restartButton;          //Restart Button object, stores X and Y coordinates of restart button
var newCategoryButton;      //New Category Button object, stores X and Y coordinates of new category button
var settingsButton;         //Settings button, stores X and Y coordinates of settings button on home screen

var difficultySelected = 0; //Different difficulty settings options button: 0=any, 1=easy, 2=medium, 3=hard


//Needed for call to API
var difficulty = "any"; //if difficulty is "any", the API does not specifiy difficulty in URL 
var numberOfQuestions = 10; //10 is default
var selectedCategory = -1; //which game category is currently selected, -1 is nil => according to index in categories array
var selectedAPICategoryCode; //correlates the selected category index in categories array to the category code the API recognizes, if the selected category is random ("ANY") the API does not specify category code in URL
let questionType = "multiple"; //this version of the game will only support multiple choice questions

//API
var dataHasBeenParsed = false; //checks whether or not the API data has been parsed, this prevents from the content constantly changing mid-game

//Used to create the different buttons that appear, stores attributes regarding coordinates and dimensions and has methods to see if mouse is hovering over (styling appearance accordingly) and to display button
class Button {
  constructor(minX, minY, width, height) {
    this.width = width;
    this.height = height;
    this.minX = minX;
    this.maxX = minX + width;
    this.minY = minY;
    this.maxY = minY + height;
  }
  
  display() {
    rect(this.minX, this.minY, this.width, this.height);
  }
  
  isHovering() {
    //check if mouse is hovering over button
    if(mouseX >= this.minX && mouseX <= this.maxX && mouseY >= this.minY && mouseY <= this.maxY) {
      setHoverButtonStyling();
      return true;
    }
    else {
      setDefaultButtonStyling();
      return false;
    }
  }
}

//Inheritance
//DifficultySetting extends Button class to add some additional functionality. This will allow to know what text to display.
class DifficultySetting extends Button {
  constructor(minX, minY, width, height, text) {
    super(minX, minY, width, height);
    this.text = text;
  }
  
  showText() {
    fill(255);
    textAlign(CENTER)
    text((this.text).toUpperCase(), this.minX + this.width/2, this.minY + this.height/2 + 10);
  }
}

//NumQuestionSetting extends Button class to add some additional functionality. This will allow to know what text to display.
class NumQuestionSetting extends Button {
  constructor(minX, minY, width, height, number) {
    super(minX, minY, width, height);
    this.number = number;
  }
  
  showText() {
    fill(255);
    textAlign(CENTER)
    text(this.number, this.minX + this.width/2, this.minY + this.height/2 + 10);
  }
}

//Used to store the different trivia sets needed to play the game. Each Question object stores a single question, its correct answer, as well as three other false answers
class Question {
 constructor(question, correctAns, wrongAnswers) {
  //wrongAnswers is going to be an array
   this.question = question;
   this.correctAns = correctAns;
   this.correctIndex = int(random(0,3));
   this.allAnswers = [];
   var tempCounter = 0;
   for(let i=0; i<4; i++) { //create new array (allAnswers[]) to store all four potential answers inside and place the correct one in a random index
     if(i != this.correctIndex) {
      this.allAnswers[i] = wrongAnswers[tempCounter];
       tempCounter += 1;
     } 
     else {
       this.allAnswers[i] = correctAns;
     }
   }
 }
  
  display() {
    fill(235,235,235);
    rect(100, 85, 700, 120);
    fill(34,158,34);
    text("Q: " + this.question, 106, 105, 690);
    fill(255);
    
    for(let i=0; i<4; i++) {
      text(this.allAnswers[i], answerButtonArray[i].minX + 10, answerButtonArray[i].maxY - 60, 295);
    }
  }
}


function setup() {
  createCanvas(900, 500);
  
  //Initialize answerButtonArray, add coordinates and dimensions of each button (object)
  answerButtonArray[0] = new Button(100, 220, 300, 85);
  answerButtonArray[1] = new Button(500, 220, 300, 85);
  answerButtonArray[2] = new Button(100, 330, 300, 85);
  answerButtonArray[3] = new Button(500, 330, 300, 85);
  
  //Initialize submitButton object, add coordinates and dimensions for object
  submitButton = new Button(width/2 - 50, 430, 100, 50);

  //Initialize homeButton object, add coordinates and dimensions for object
  homeButton = new Button(20, 20, 70, 30);
  
  //Initialize restartButton object, add coordinates and dimensions for object
  restartButton = new Button(width/2 - 200, height - 200, 400, 50);

  //Initialize newCategoryButton object, add coordinates and dimensions for object
  newCategoryButton = new Button(width/2 - 200, height - 125, 400, 50);
  
  //Initialize Settings button, add coordinates and dimensions for object
  settingsButton = new Button(width - 117, 20, 100, 30);
  
  //Initialize Category Button array with button objects storing the coordinates of the different category buttons
  var row = 0;
  var column = 0;

  for(let i=0; i<categories.length; i++) {
    if(row == 4) {
      row = 0; column += 1;
    }
    categoryButtonArray[i] = new Button(100 + (column*250), height - 360 + (row*85), 200, 50);
    row += 1;
  }  
}


function draw() {
  background(199,36,177);
  fill(255);
  
  //IF USER IS AT HOME SCREEN
  if(screen == 0) {
    textSize(32);
    textAlign(CENTER);
    fill(255);
    text("TRIVIA+", width/2, 50);
    textSize(28);
    text("Click on a category to begin", width/2, 95);

    //Draw category buttons
    for(let i=0; i<categories.length; i++) {      
      categoryButtonArray[i].isHovering(); //Check if mouse is hovering over one of the category buttons
      categoryButtonArray[i].display(); //Draw category button
      fill(255);
      text(categories[i], categoryButtonArray[i].minX + 100, categoryButtonArray[i].minY + 34);
    }
    
    //Draw Settings button
    settingsButton.isHovering();
    settingsButton.display();
    fill(255);
    textSize(20);
    text("Settings", settingsButton.minX + settingsButton.width/2 - 1, settingsButton.maxY - 9);
  } 
  
  //IF USER IS AT ACTIVE GAME SCREEN - CURRENTLY PLAYING A GAME
  else if(screen == 1) {
    
    //API connection
    //If data hasn't been already read
    if(!dataHasBeenParsed) {
      //Formulate URL from which API data will be parsed according to user preferences (category, difficulty, number of questions)
      if(selectedCategory == 1 && difficulty === "any") { //if category is random ("any") and difficulty is also random ("any"), in this case category and difficulty parameters are not specified in API URL
        loadJSON("https://opentdb.com/api.php?amount=" + numberOfQuestions + "&type=multiple", gotData); //API connection
      }
      else if(selectedCategory == 1) {
        loadJSON("https://opentdb.com/api.php?amount=" + numberOfQuestions + "&difficulty=" + difficulty + "&type=multiple", gotData);
      }
      else if(difficulty === "any") {
        selectedAPICategoryCode = convertAPICategoryCode(selectedCategory); //Convert the index of the selected category to the corresponding category code recognized by the API
        loadJSON("https://opentdb.com/api.php?amount=" + numberOfQuestions + "&category=" + selectedAPICategoryCode + "&type=multiple", gotData);
      }
      else {
        selectedAPICategoryCode = convertAPICategoryCode(selectedCategory);
        loadJSON("https://opentdb.com/api.php?amount=" + numberOfQuestions + "&category=" + selectedAPICategoryCode + "&difficulty=" + difficulty +"&type=multiple", gotData);
      }
    }

    if(triviaAPI) { 
      //NEED TO FIRST PARSE DATA FROM API TO ARRAY 
      if(dataHasBeenParsed) {
        textSize(22);
        textAlign(LEFT);
        fill(255); 
        
        //Draw Answer Buttons
        for(let i=0; i<4; i++) {
          answerButtonArray[i].isHovering(); //Check if mouse is hovering over any of the answer buttons

          if(i==selectedAnswer) { //If an answer has been selected, color it differently
            fill(255,0,0);
          }
          answerButtonArray[i].display(); //draw answer button
        }
        
        //SHOW CURRENT QUESTION
        questionsAnswers[questionCount].display();
  
        textAlign(RIGHT);
        text("Question " + (questionCount+1) + "/" + numberOfQuestions, width - 12, 30); //Draw question count
        text("Score: " + score, width - 12, 60); //Draw score
        
        //Draw submit button
        textAlign(CENTER);
        submitButton.isHovering(); //Check if mouse is hovering over the submit button
        submitButton.display(); //Draw buton
        fill(255);
        text("SUBMIT", submitButton.minX + 49, submitButton.maxY - 18);
        
        //Draw home button
        homeButton.isHovering() //Check if mouse is hovering over the home button
        homeButton.display();
        textSize(20);
        fill(255); //can also make this purple or smth
        text("HOME", 54, 42); 
      }
      else { //PARSE DATA FROM API INTO QUESTIONSANSWERS ARRAY
        //READ EACH PROPERTY OF QUESTION OBJECT SEPARATELY,CREATE NEW QUESTION OBJECT FOR EACH QUESTION SET, PLACED OBJECT IN ARRAY
        for(let i=0; i<numberOfQuestions; i++) {
          let questionAPI = triviaAPI.results[i].question;
          let correctAnswer = triviaAPI.results[i].correct_answer;
          let incorrectAnswers = triviaAPI.results[i].incorrect_answers;
          let currentQA = new Question(questionAPI, correctAnswer, incorrectAnswers);
          
          questionsAnswers[i] = currentQA;
        }  
        dataHasBeenParsed = true;
      }
    } 
    else {
      //IF THE API CANNOT CONNECT
      textSize(30);
      textAlign(CENTER);
      text("CANNOT CONNECT TO SERVER\n---------------\nPLEASE CHECK YOUR INTERNET CONNECTION", width/2, height/2 - 60);
    }
  }
  
  //GAME OVER SCREEN
  else if(screen == 2) {
    textSize(72);
    textAlign(CENTER);
    text("Well Done!", width/2, 105);
    textSize(40);
    //Display final score to player
    text("You answered\n " + score + "/" + numberOfQuestions + " questions correctly!", width/2, 165);
    
    textSize(32);
    //Draw restart button
    restartButton.isHovering(); //Check if mouse is hovering over the restart button
    restartButton.display(); //draw restart button
    fill(0);
    text("Play Again", width/2, restartButton.minY + 34);
    
    //Draw choose new category button
    newCategoryButton.isHovering(); //Check if mouse is hovering over the main menu / new category button
    newCategoryButton.display(); //draw new category button
    fill(0);
    text("Choose New Category", width/2, newCategoryButton.minY + 35);
  
  } 
  
  else if(screen == 3) {
    textSize(32);
    textAlign(CENTER);
    fill(255);
    text("SETTINGS", width/2, 60);
    textSize(28);
    
    //Display Difficulty Settings
    text("Select Difficulty:", width/2, 120);
    difficultySettings = [
      new DifficultySetting(90, 150, 150, 50, "any"), 
      new DifficultySetting(280, 150, 150, 50, "easy"), 
      new DifficultySetting(470, 150, 150, 50, "medium"), 
      new DifficultySetting(660, 150, 150, 50, "hard"),
    ]; //0=any, 1=easy, 2=,medium, 3=hard
    
    for(let i=0; i<difficultySettings.length; i++) {
      difficultySettings[i].isHovering();
      if(i == difficultySelected) { fill(255,0,0); }
      difficultySettings[i].display();
      difficultySettings[i].showText();
    }
    
    //Display Number Of Questions Settings
    text("Number Of Questions Per Game:", width/2, 290);
    numQuestionSettings = [
      new NumQuestionSetting(90, 320, 150, 50, 5), 
      new NumQuestionSetting(280, 320, 150, 50, 10), 
      new NumQuestionSetting(470, 320, 150, 50, 15), 
      new NumQuestionSetting(660, 320, 150, 50, 20),
    ]; //0=any, 1=easy, 2=,medium, 3=hard
    
    for(let i=0; i<numQuestionSettings.length; i++) {
      numQuestionSettings[i].isHovering();
      if(numQuestionSettings[i].number == numberOfQuestions) { fill(255,0,0); }
      numQuestionSettings[i].display();
      numQuestionSettings[i].showText();
    }
    
    //Draw home button
    homeButton.isHovering() //Check if mouse is hovering over the home button
    homeButton.display();
    textSize(20);
    fill(255); //can also make this purple or smth
    text("HOME", 54, 42); 
    
  }
  else { //safety case
    screen = 0;
  }
}

function gotData(data) {
  triviaAPI = data;
}

//If mouse is clicked
function mousePressed() {
  //Only checks if mouse is clicking on one of the elements on the home screen
  if(screen == 0) {
    for(let i=0; i<categories.length; i++) {
      //Check if the user is clicking on a category
      if(categoryButtonArray[i].isHovering()) {
        //select category
        selectedCategory = i;
        screen = 1; //go to next screen
      }
    }
    
    if(settingsButton.isHovering()) {
      screen = 3;
    }
  }
  //Only checks if mouse is clicking on one of the elements on the active game screen
  else if(screen == 1) {
    for(let i=0; i<4; i++) {
      //Check if the user is clicking on one of the answer buttons
      if(answerButtonArray[i].isHovering()) {
        selectedAnswer = i; //Select answer
      }
    }
    
    //If mouse is hovering over home button and is clicked, go back to the initial screen and reset everything
    if(homeButton.isHovering()) {
      goBackToHome();
    }
    
    //If submit button is clicked and an answer has been selected
    else if(submitButton.isHovering() && selectedAnswer != -1) {
      //If answer is correct, increase score
      if(selectedAnswer == questionsAnswers[questionCount].correctIndex) {
        score += 1;
      }
      questionCount += 1; //go to next question
      if(questionCount == numberOfQuestions) { //If questions have all been answered, go to end game screen
        screen = 2;
      }
      
      selectedAnswer = -1; //deselect answer after it has been submitted
  
    }
  }
  
  //Only checks if mouse is clicking on one of the elements on the game over screen
  else if(screen == 2) {
    //check if mouse is clicking on restart button
    if(restartButton.isHovering()) { //restart game, keep same category
      dataHasBeenParsed = false;
      screen = 1;
      score = 0;
      questionCount = 0;
      selectedAnswer = -1;

    }
    //check if mouse is clicking on new category button
    else if(newCategoryButton.isHovering()) { //completely restart the game, new category has to be selected
      goBackToHome();
    }
  }
  
  //Only checks if mouse is clicking on one of the elements on the settings page
  else if(screen == 3) {
    for(let i=0; i<difficultySettings.length; i++) {
      //Check what difficulty has been selected
      if(difficultySettings[i].isHovering()) {
        difficultySelected = i;
        difficulty = difficultySettings[i].text;
      }
      
      //Check what desired number of questions is
      if(numQuestionSettings[i].isHovering()) {
        numberOfQuestions = numQuestionSettings[i].number;
      }
    }
    
    if(homeButton.isHovering()) { //If mouse is hovering over home button and is clicked, go back to the initial screen and reset everything
      goBackToHome();
    }
  }
}

//Convert the index of the selected category to the corresponding category code recognized by the API
function convertAPICategoryCode(code) {
  var convertedCode = "";
  
  //USED A SWITCH STATEMENT INSTEAD OF MULTIPLE IF-ELSE STATEMENTS TO TRY SOMETHING NEW OUT
  switch(code) {
    case 0:  //General
      convertedCode = "9";
      break;
    case 1: //Random
      convertedCode = "";
      break;
    case 2: //Animals
      convertedCode = "27";
      break;
    case 3: //Geography
      convertedCode = "22";
      break;
    case 4: //History
      convertedCode = "23";
      break;
    case 5: //Movies
      convertedCode = "11";
      break;
    case 6: //Music
      convertedCode = "12";
      break;
    case 7: //Math
      convertedCode = "19";
      break;
    case 8: //Pop Culture
      convertedCode = "26";
      break;
    case 9: //Science
      convertedCode = "17";
      break;
    case 10: //Sports
      convertedCode = "21";
      break;
    case 11: //Television
      convertedCode = "14";
      break;
  }
  return convertedCode;
}

//Sets the styling preferences to the default color scheme for buttons
function setDefaultButtonStyling() {
  strokeWeight(3);
  fill(34,158,34);
}

//Sets the styling preferences to the hover color scheme for buttons
function setHoverButtonStyling() {
  strokeWeight(4);
  fill(128, 0, 128);
}

//Restart game variables 
function goBackToHome() {
  screen = 0;
  selectedCategory = -1;
  dataHasBeenParsed = false;
  score = 0;
  questionCount = 0;
  selectedAnswer = -1;
}
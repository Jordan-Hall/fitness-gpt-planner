import './style.css'
import MarkdownIt from 'markdown-it';
import OpenAI from "openai";


const md = new MarkdownIt();
const app = document.getElementById('app') as HTMLElement;
let formElement;

function renderLandingPage() {
  const container = document.createElement('div');
  container.className = 'bg-white p-8 rounded-lg shadow-md';

  const heading = document.createElement('h1');
  heading.className = 'text-2xl font-bold mb-4';
  heading.textContent = 'Fitness GPT Planner';
  container.appendChild(heading);

  const description = document.createElement('p');
  description.className = 'mb-4';
  description.textContent = 'Get a personalized fitness plan powered by AI. Start by entering your OpenAI API key.';
  container.appendChild(description);

  const apiKeyInput = document.createElement('input');
  apiKeyInput.type = 'text';
  apiKeyInput.id = 'apiKey';
  apiKeyInput.className = 'border p-2 w-full mb-4';
  apiKeyInput.placeholder = 'API Key';
  apiKeyInput.value = getStoreAPIKey()
  container.appendChild(apiKeyInput);

  const startButton = document.createElement('button');
  startButton.className = 'bg-blue-500 text-white p-2 rounded w-full';
  startButton.textContent = 'Start';
  startButton.onclick = () => {
    storeAPIKey();
    formElement.style.display = 'block';
    container.style.display = 'none';
  };
  container.appendChild(startButton);

  app.appendChild(container);
}

function storeAPIKey() {
  const apiKey = document.getElementById('apiKey').value;
  localStorage.setItem('apiKey', apiKey);
}

function getStoreAPIKey() {
  return localStorage.getItem('apiKey') ?? ''; 
}


function renderFormPage() {
  formElement = document.createElement('div');
  formElement.className = 'bg-white p-8 rounded-lg shadow-md w-1/2 mx-auto mt-10';
  formElement.style.display = 'none'; // initially hidden

  const formFields = [
    { label: 'Age', type: 'number', id: 'age', placeholder: 'Enter your age' },
    { label: 'Height (in cm)', type: 'number', id: 'height', placeholder: 'Enter your height in cm' },
    { label: 'Weight (in kg)', type: 'number', id: 'weight', placeholder: 'Enter your weight in kg' },
    { label: 'Timeframe (in weeks)', type: 'number', id: 'timeframe', placeholder: 'Enter the number of weeks' },
    { label: 'Workout Days Per Week', type: 'number', id: 'workoutDays', placeholder: 'Enter the number of days' },
    { label: 'Preferred Exercise Style', type: 'text', id: 'exerciseStyle', placeholder: 'Enter your preferred exercise style' }
  ];

  for (const field of formFields) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'mb-4';

    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'block text-gray-700 text-sm font-bold mb-2';
    fieldLabel.setAttribute('for', field.id);
    fieldLabel.textContent = field.label;
    fieldContainer.appendChild(fieldLabel);

    const fieldInput = document.createElement('input');
    fieldInput.type = field.type;
    fieldInput.id = field.id;
    fieldInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline';
    fieldInput.placeholder = field.placeholder;
    if (localStorage.getItem(field.id)) {
      fieldInput.value = localStorage.getItem(field.id);
    }
    fieldContainer.appendChild(fieldInput);

    formElement.appendChild(fieldContainer);
  }

  // Food Allergies Radio Buttons
  const allergiesContainer = document.createElement('div');
  allergiesContainer.className = 'mb-4';

  const allergiesLabel = document.createElement('label');
  allergiesLabel.className = 'block text-gray-700 text-sm font-bold mb-2';
  allergiesLabel.textContent = 'Have Food Allergies?';
  allergiesContainer.appendChild(allergiesLabel);

  ['Yes', 'No'].forEach(optionValue => {
    const optionContainer = document.createElement('div');
    optionContainer.className = 'mt-2';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'allergies';
    radio.value = optionValue;
    radio.id = `allergies-${optionValue.toLowerCase()}`;
    radio.onclick = function() {
      document.getElementById('allergiesDescription').style.display = optionValue === 'Yes' ? 'block' : 'none';
    };
    if (localStorage.getItem('allergies') === optionValue) {
      radio.checked = true;
    }
    optionContainer.appendChild(radio);

    const radioLabel = document.createElement('label');
    radioLabel.className = 'ml-2 text-gray-700';
    radioLabel.setAttribute('for', radio.id);
    radioLabel.textContent = optionValue;
    optionContainer.appendChild(radioLabel);

    allergiesContainer.appendChild(optionContainer);
  });

  formElement.appendChild(allergiesContainer);

  const allergiesTextareaContainer = document.createElement('div');
  allergiesTextareaContainer.className = 'mb-4';
  allergiesTextareaContainer.id = 'allergiesDescription';
  allergiesTextareaContainer.style.display = localStorage.getItem('allergies') === 'Yes' ? 'block' : 'none';

  const textareaLabel = document.createElement('label');
  textareaLabel.className = 'block text-gray-700 text-sm font-bold mb-2';
  textareaLabel.textContent = 'List your food allergies';
  allergiesTextareaContainer.appendChild(textareaLabel);

  const allergiesTextarea = document.createElement('textarea');
  allergiesTextarea.id = 'allergiesList';
  allergiesTextarea.rows = 4;
  allergiesTextarea.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline';
  allergiesTextarea.placeholder = 'Enter your allergies here';
  if (localStorage.getItem('allergiesList')) {
    allergiesTextarea.value = localStorage.getItem('allergiesList');
  }
  allergiesTextareaContainer.appendChild(allergiesTextarea);

  formElement.appendChild(allergiesTextareaContainer);
  const genderContainer = document.createElement('div');
  genderContainer.className = 'mb-4';

  const genderLabel = document.createElement('label');
  genderLabel.className = 'block text-gray-700 text-sm font-bold mb-2';
  genderLabel.textContent = 'Gender';
  genderContainer.appendChild(genderLabel);

  const genderSelect = document.createElement('select');
  genderSelect.id = 'gender';
  genderSelect.className = 'block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline';
  ['Male', 'Female', 'Non-Binary', 'Other'].forEach(optionValue => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    genderSelect.appendChild(option);
  });
  if (localStorage.getItem('gender')) {
    genderSelect.value = localStorage.getItem('gender');
  }
  genderContainer.appendChild(genderSelect);

  formElement.appendChild(genderContainer);

  const textareaContainer = document.createElement('div');
  textareaContainer.className = 'mb-4';

  const textareaLabel2 = document.createElement('label');
  textareaLabel2.className = 'block text-gray-700 text-sm font-bold mb-2';
  textareaLabel2.textContent = 'Primary Fitness Goals';
  textareaContainer.appendChild(textareaLabel2);

  const goalsTextarea = document.createElement('textarea');
  goalsTextarea.id = 'goals';
  goalsTextarea.rows = 4;
  goalsTextarea.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline';
  goalsTextarea.placeholder = 'Describe your fitness goals';
  if (localStorage.getItem('goals')) {
    goalsTextarea.value = localStorage.getItem('goals');
  }
  textareaContainer.appendChild(goalsTextarea);

  formElement.appendChild(textareaContainer);

  const submitButton = document.createElement('button');
  submitButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-4';
  submitButton.textContent = 'Submit';
  submitButton.onclick = function() {
    // Store the data in local storage
    for (const field of formFields) {
      localStorage.setItem(field.id, document.getElementById(field.id).value);
    }
    localStorage.setItem('gender', document.getElementById('gender').value);
    localStorage.setItem('goals', document.getElementById('goals').value);
    localStorage.setItem('allergies', document.querySelector('input[name="allergies"]:checked').value);
    localStorage.setItem('allergiesList', document.getElementById('allergiesList').value);
    streamOpenAIResponse();
  };
  formElement.appendChild(submitButton);
  app.appendChild(formElement);
  
}

let markdownBuffer = '';


async function streamOpenAIResponse() {
  const apiKey = localStorage.getItem('apiKey');
  const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
  
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  const height = document.getElementById('height').value;
  const weight = document.getElementById('weight').value;
  const allergiesSelection = document.querySelector('input[name="allergies"]:checked').value;
  const allergiesDescription = allergiesSelection === 'Yes' ? document.getElementById('allergiesList').value : "no";
  const goals = document.getElementById('goals').value;
  const timeframe = document.getElementById('timeframe').value;
  const workoutDays = document.getElementById('workoutDays').value;
  const exerciseStyle = document.getElementById('exerciseStyle').value;

  const userMessage = ` I am ${age} years old, ${gender}, ${height}cm. My current weight is ${weight} kilograms. I have ${allergiesSelection === 'Yes' ? 'the following' : 'no'} food allergies${allergiesSelection === 'Yes' ? (': ' + allergiesDescription) : ''}. My primary fitness and health goals are ${goals}. I would like to achieve this in ${timeframe} weeks. I can commit to working out ${workoutDays} days per week. I prefer and enjoy ${exerciseStyle} style of exercise.`;

  const systemMessage = `
You are a highly renowned health and nutrition expert Fitness GPT.

I want a custom diet and exercise plan broken down week-by-week over a 12-week period. Provide details in the following structured format:

1. **Introduction**: A brief 2-sentence overview of the entire plan.

2. **Exercise Plan**: 
    - **Summary**: 3 sentences about the overall exercise strategy.
    - **Week-by-Week Breakdown**: 
        - For each week, specify:
            - Key focus or theme for the week.
            - List of 5 primary exercises with brief descriptions.
            - Any specific progressions or modifications from the previous week.
    
3. **Diet Plan**: 
    - **Overview**: A general guideline on the nutritional approach.
    - **Week-by-Week Breakdown**: 
        - For each week, suggest:
            - Primary nutritional focus or theme.
            - Daily meal recommendations, considering any food allergies.
    
4. **Conclusion**: A 2-sentence wrap-up on how to stay consistent and achieve the stated goals.

Avoid any superfluous pre and post descriptive text. Don't break character under any circumstance.
`;
  try {
      const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
              { role: "system", content: systemMessage },
              {"role": "user", "content": userMessage}
          ],
          stream: true,
      });
      for await (const chunk of completion) {
        processChunk(chunk.choices[0].delta.content);
      }

  } catch (error) {
      console.error("Error streaming from OpenAI:", error);
  }
}

function processChunk(chunk) {
  markdownBuffer += chunk;

  // Split buffer by newline to identify complete lines
  const lines = markdownBuffer.split('\n');

  // If we have more than one line, we know we have at least one complete line to render
  if (lines.length > 1) {
      // Join all but the last line, which may be incomplete
      const completeLines = lines.slice(0, -1).join('\n');
      renderMarkdown(completeLines);

      // Keep the potentially incomplete line in the buffer
      markdownBuffer = lines[lines.length - 1];
  }
}


function renderMarkdown(markdown) {
  debugger;
  // If the markdown container doesn't exist, create it and the back button.
  if (!document.getElementById('markdownContainer')) {
      app.innerHTML = '';

      const markdownContainer = document.createElement('div');
      markdownContainer.id = 'markdownContainer';
      markdownContainer.className = 'bg-white p-8 rounded-lg shadow-md w-3/4';
      app.appendChild(markdownContainer);

      const backButton = document.createElement('button');
      backButton.className = 'bg-blue-500 text-white p-2 rounded mt-4';
      backButton.textContent = 'Go Back';
      backButton.onclick = () => {
          markdownContainer.style.display = 'none';
          formElement.style.display = 'block'; // Show the form again
      };
      app.appendChild(backButton);
  }

  // Append the markdown chunk to the existing markdown container
  const markdownContainer = document.getElementById('markdownContainer');
  markdownContainer.innerHTML += md.render(markdown);
}


renderLandingPage();
renderFormPage();


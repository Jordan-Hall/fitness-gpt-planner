import './style.css'
import MarkdownIt from 'markdown-it';
import OpenAI from "openai";
const md = new MarkdownIt();
const app = document.getElementById('app') as HTMLElement;


type ApiRequestType = 'introduction' | 'exercise' | 'diet' | 'mentalWellbeing' | 'progressTracking' | 'recoveryRest' | 'safetyPrecautions' | 'nutritionTips';


class FormField {
  label: string;
  type: string;
  id: string;
  placeholder: string;
  options?: string[];
  subFields?: FormField[];
  rows?: number;
  customLogic?: (domRef: HTMLElement, formInstance: FitnessGPTForm) => void;

  constructor(label: string, type: string, id: string, placeholder: string, options?: string[], customLogic?: (domRef: HTMLElement, formInstance: FitnessGPTForm) => void, subFields?: FormField[], rows?: number) {
    this.label = label;
    this.type = type;
    this.id = id;
    this.placeholder = placeholder;
    if (options) {
      this.options = options;
    }
    if (subFields) {
      this.subFields = subFields;
    }
    if (customLogic) {
      this.customLogic = customLogic;
    }
    if (rows) {
      this.rows = rows;
    }
  }
}

class FitnessGPTForm {
  public domReferences: Record<string, HTMLElement> = {};
  public formFields: FormField[] = [
    new FormField('Age', 'number', 'age', 'Enter your age'),
    new FormField('Gender', 'select', 'gender', '', ['Male', 'Female', 'Non-Binary', 'Other']),
    new FormField('Height (in cm)', 'number', 'height', 'Enter your height in cm'),
    new FormField('Weight (in kg)', 'number', 'weight', 'Enter your weight in kg'),
    new FormField('Target Weight (in kg)', 'number', 'targetWeight', 'Enter your target weight in kg'),
    new FormField('Job Type', 'select', 'jobType', '', ['Sedentary (e.g., desk job)', 'Light Activity (e.g., teacher, retail)', 'Moderate Activity (e.g., mechanic, cleaner)', 'Heavy Activity (e.g., construction, dancer)', 'Very Heavy Activity (e.g., athlete, farmer)']),
    new FormField('Current Fitness Level', 'select', 'fitnessLevel', '', ['Beginner', 'Intermediate', 'Advanced']),
    new FormField('Timeframe (in weeks)', 'number', 'timeframe', 'Enter the number of weeks'),
    new FormField('Workout Days Per Week', 'number', 'workoutDays', 'Enter the number of days'),
    new FormField('Preferred Exercise Style', 'text', 'exerciseStyle', 'Enter your preferred exercise style'),
    new FormField('Preferred Workout Duration (in minutes)', 'number', 'workoutDuration', 'e.g., 30'),
    new FormField('Equipment Availability', 'text', 'equipment', 'List equipment you have (e.g., dumbbells, treadmill)'),
    new FormField('Injuries or Physical Limitations', 'text', 'injuries', 'List any injuries or limitations'),
    new FormField('Primary Fitness Goals', 'textarea', 'goals', 'Describe your fitness goals'),
    new FormField('Dietary Preference', 'select', 'dietPreference', '', ['Vegetarian', 'Vegan', 'Pescatarian', 'No Preference']),
    new FormField('Have Food Allergies?', 'radio', 'allergies', '', ['Yes', 'No'], (domRef: HTMLElement, _formInstance: FitnessGPTForm) => {
      const allergiesTextArea = this.domReferences['allergiesList'] as HTMLTextAreaElement;
      if ((<HTMLInputElement>domRef.querySelector('input[value="Yes"]')).checked) {
        allergiesTextArea.style.display = 'block';
      } else {
        allergiesTextArea.style.display = 'none';
      }
      domRef.addEventListener('change', (e: Event) => {
        allergiesTextArea.style.display = ((<HTMLInputElement>e.target).value === 'Yes') ? 'block' : 'none';
      });
    }, [
      new FormField('List your food allergies', 'textarea', 'allergiesList', 'Enter your allergies here')
    ]),
    new FormField('Dietary Restrictions', 'text', 'dietRestrictions', 'Foods you strictly avoid'),
    new FormField('Frequency of Meals', 'number', 'mealFrequency', 'e.g., 3 for 3 meals a day'),
    new FormField('Average Daily Water Intake (in liters)', 'number', 'waterIntake', 'e.g., 2'),
    new FormField('Average Sleep Duration (in hours)', 'number', 'sleepDuration', 'e.g., 7'),
    new FormField('Supplementation', 'text', 'supplements', 'List any supplements you take')
  ];


  constructor(private container: HTMLElement) { }

  render() {
    this.formFields.forEach(field => {
      const renderedField = this.renderFormField(field);
      this.container.appendChild(renderedField);
    });
    const submitButton = document.createElement('button');
    submitButton.className = 'bg-blue-500 text-white p-2 rounded w-full mt-4';
    submitButton.textContent = 'Submit';
    submitButton.onclick = () => {
      this.saveToLocalStorage();
      streamOpenAIResponse('introduction');
      app.innerHTML = '';
      if (!document.getElementById('markdownContainer')) {
        const markdownContainer = document.createElement('div');
        markdownContainer.id = 'markdownContainer';
        markdownContainer.className = 'bg-white p-8 rounded-lg shadow-md w-3/4';
        app.appendChild(markdownContainer);
      }

      // Then show the loadingText
      loadingText.style.display = 'block';
      updateLoadingText();
      app.appendChild(loadingText);
    };
    this.container.appendChild(submitButton);
  }

  private renderFormField(field: FormField): HTMLElement {
    let formElement: HTMLElement;

    switch (field.type) {
      case 'text':
      case 'number':
      case 'tel':
      case 'url':
      case 'email':
        formElement = document.createElement('input');
        formElement.setAttribute('type', field.type);
        formElement.setAttribute('id', field.id);
        formElement.setAttribute('placeholder', field.placeholder || '');
        formElement.classList.add('border', 'rounded-md', 'p-2', 'w-full', 'mt-2');
        break;
      case 'select':
        formElement = document.createElement('select');
        formElement.setAttribute('id', field.id);
        formElement.classList.add('border', 'rounded-md', 'p-2', 'w-full', 'mt-2');
        if (field.options && field.options.length) {
          field.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            formElement.appendChild(optionElement);
          });
        }
        break;
      case 'textarea':
        formElement = document.createElement('textarea');
        formElement.setAttribute('id', field.id);
        formElement.setAttribute('placeholder', field.placeholder || '');
        formElement.classList.add('border', 'rounded-md', 'p-2', 'w-full', 'mt-2');
        if (field.rows) {
          formElement.setAttribute('rows', field.rows.toString());
        }
        break;
      case 'radio':
      case 'checkbox':
        formElement = document.createElement('div');
        if (field.options) {
          field.options.forEach(option => {
            const optionElement = document.createElement('input');
            optionElement.setAttribute('type', field.type);
            optionElement.setAttribute('id', `${field.id}-${option}`);
            optionElement.setAttribute('name', field.id);
            optionElement.setAttribute('value', option);
            const label = document.createElement('label');
            label.setAttribute('for', `${field.id}-${option}`);
            label.textContent = option;
            formElement.appendChild(optionElement);
            formElement.appendChild(label);
          });
        }
        break;
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }

    // Populate the value from localStorage if available
    const storedValue = localStorage.getItem(field.id);
    if (storedValue !== null) {
      switch (field.type) {
        case 'text':
        case 'number':
        case 'tel':
        case 'url':
        case 'email':
        case 'textarea':
          (formElement as HTMLInputElement).value = storedValue;
          break;

        case 'select':
          (formElement as HTMLSelectElement).value = storedValue;
          break;

        case 'radio':
        case 'checkbox':
          if (field.options) {
            field.options.forEach(option => {
              const optionId = `${field.id}-${option}`;
              const optionElement = this.domReferences[optionId] as HTMLInputElement;
              if (optionElement) {
                optionElement.checked = option === storedValue;
              }
            });
          }
          break;
      }
    }
    // Store the DOM reference
    this.domReferences[field.id] = formElement;

    // Wrap in a div for layout
    const wrapper = document.createElement('div');
    wrapper.classList.add('form-field-wrapper', 'mb-4');

    const label = document.createElement('label');
    label.setAttribute('for', field.id);
    label.textContent = field.label;
    label.classList.add('block', 'text-lg', 'font-semibold');

    wrapper.appendChild(label);
    wrapper.appendChild(formElement);

    // If field has subFields, render and populate them
    if (field.subFields) {
      field.subFields.forEach(subField => {
        const renderedSubField = this.renderFormField(subField);
        wrapper.appendChild(renderedSubField);
      });
    }

    if (field.customLogic) {
      formElement.addEventListener('change', (_e: Event) => {
        if (field.customLogic) {
          field.customLogic(formElement, this);
        }
      });
      // Execute the custom logic once after setting up the event listener to initialize the state
      field.customLogic(formElement, this);
    }

    return wrapper;
  }



  saveToLocalStorage() {
    this.formFields.forEach(field => {
      switch (field.type) {
        case 'text':
        case 'number':
        case 'tel':
        case 'url':
        case 'email':
        case 'textarea':
        case 'select':
          const value = (this.domReferences[field.id] as HTMLInputElement)?.value;
          if (value) {
            localStorage.setItem(field.id, value);
          }
          break;

        case 'radio':
        case 'checkbox':
          if (field.options) {
            field.options.forEach(option => {
              const optionId = `${field.id}-${option}`;
              const optionElement = this.domReferences[optionId] as HTMLInputElement;
              if (optionElement && optionElement.checked) {
                localStorage.setItem(field.id, option);
              }
            });
          }
          break;
      }

      // Save subFields to localStorage
      if (field.subFields) {
        field.subFields.forEach(subField => {
          const value = (this.domReferences[subField.id] as HTMLInputElement)?.value;
          if (value) {
            localStorage.setItem(subField.id, value);
          }
        });
      }
    });
  }

}

const loadingText = document.createElement('div');
loadingText.textContent = "Generating plan...";
loadingText.className = "text-blue-500 font-bold mt-4";
loadingText.style.display = 'none'; // initially hidden


let dotsCount = 0;
let animationFrameId: number;
let timeoutId: number | null = null;
const animationDelay = 500;  // 500ms delay for half a second between each update

function updateLoadingText() {
  if (loadingText.style.display === 'none') {
    // If the loadingText is hidden, stop the animation
    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    return;
  }

  dotsCount = (dotsCount + 1) % 4; // Cycle between 0 to 3 dots
  const dots = '.'.repeat(dotsCount);
  loadingText.textContent = "Generating plan" + dots;

  // Call the next animation frame after a delay
  timeoutId = setTimeout(() => {
    animationFrameId = requestAnimationFrame(updateLoadingText);
  }, animationDelay);
}

function renderLandingPage() {
  const container = document.createElement('div');
  container.className = 'bg-white p-8 rounded-lg shadow-md';

  const heading = document.createElement('h1');
  heading.className = 'text-2xl font-bold mb-4';
  heading.textContent = 'Fitness GPT Planner';
  container.appendChild(heading);

  const description = document.createElement('p');
  description.className = 'mb-4';
  description.innerHTML = `
    Get a personalized fitness plan powered by AI. We have provided a key by default, 
    but there's a hard limit of $120, and will be removed shortly. Please consider 
    <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer">signing up for your own key</a> 
    at OpenAI. It helps keep this service going as it's open-source and self-funded.
`;
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

  container.appendChild(createDisclaimer());

  app.appendChild(container);
}

function storeAPIKey() {
  const apiKey = (document.getElementById('apiKey') as HTMLInputElement)?.value;
  localStorage.setItem('apiKey', apiKey);
}

function getStoreAPIKey() {
  return localStorage.getItem('apiKey') ?? import.meta.env.VITE_OPENAI_KEY ?? process.env.VITE_OPENAI_KEY;
}


let messageHistory: { role: OpenAI.Chat.CreateChatCompletionRequestMessage['role'], content: string }[] = [];
async function streamOpenAIResponse(stage: ApiRequestType, currentWeek = 1, hasProvidedInitialExerciseDetails = false) {

  const apiKey = getStoreAPIKey();
  const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

  // Dynamically get all form data
  const formData = getFormData(form);

  const allergiesSelection = formData['allergies'];
  const allergiesDescription = allergiesSelection === 'Yes' ? formData['allergiesList'] : "no";

  const userMessage = `I am a ${formData['age']} years old ${formData['gender']} with a height of ${formData['height']}cm and weight of ${formData['weight']} kilograms. My target weight is ${formData['targetWeight']} kilograms. I work as a ${formData['jobType']}, and identify my fitness level as ${formData['fitnessLevel']}. I prefer a ${formData['dietPreference']} diet and have access to the following equipment: ${formData['equipment']}. My injuries or limitations include: ${formData['injuries']}. My workout preference is around ${formData['workoutDuration']} minutes, and I avoid the following foods: ${formData['dietRestrictions']}. Typically, I consume ${formData['mealFrequency']} meals a day, drink ${formData['waterIntake']} liters of water daily, and sleep for ${formData['sleepDuration']} hours. I take the following supplements: ${formData['supplements']}. I have ${allergiesSelection === 'Yes' ? 'the following' : 'no'} food allergies${allergiesSelection === 'Yes' ? (': ' + allergiesDescription) : ''}. My primary fitness and health goals are: ${formData['goals']}. I aim to achieve these goals in ${formData['timeframe']} weeks, committing to ${formData['workoutDays']} workout days per week. I primarily enjoy ${formData['exerciseStyle']} exercises.`;

  const userInjuries = formData['injuries'];

  let injurySegment = '';
  if (userInjuries && userInjuries.toLowerCase() !== 'none' && userInjuries.toLowerCase() !== '') {
    injurySegment = `Given the reported injury/limitation of "${userInjuries}", please provide both a light training option that is gentler on the affected area, as well as an alternative exercise that avoids targeting the injured part entirely. `;
  }

  let systemMessageSegment;
  switch (stage) {
    case "introduction":
      systemMessageSegment = `
      1. Provide the section titled 'Introduction'. This should be a 2-sentence overview of the entire plan tailored to the user's profile.\n`;
      break;
    case "exercise":
      if (!hasProvidedInitialExerciseDetails) {
        systemMessageSegment = `
      Now, for the 'Exercise Plan' section.
      2. **Exercise Plan**:
      - **Flexibility and Mobility**: Provide a list of stretching and mobility exercises to be incorporated weekly.
      - **Cardiovascular Recommendations**: Detail on types, duration, and intensity of cardiovascular workouts.
      - **Strength Training**: Breakdown of exercises into compound and isolation movements, with specifics on sets, reps, rest intervals, and progression.
      ${injurySegment}
      - **Summary**: 3 sentences about the overall exercise strategy considering the user's fitness level, available equipment, preferred workout duration, and any injuries. \n`;
      } else {
        systemMessageSegment = `**Week ${currentWeek} Exercise Breakdown**:
              - Key focus or theme for the week.
              - **Day-by-Day Breakdown**:
                  - For each day, specify:
                      - Warm-Up: Suggest specific warm-up routines.
                      - Primary exercises to be performed. For each exercise, specify:
                          - Repetitions or duration.
                          - Rest intervals between sets or exercises.
                          - Number of sets.
                      ${injurySegment}
                      - Cool Down: Suggest specific cool-down routines.
                      - If it's a rest day, clearly mention it. \n`;
      }
      break;
    case "diet":
      if (!hasProvidedInitialExerciseDetails) {
        systemMessageSegment = `Next, the 'Diet Plan' section.
          3. **Diet Plan**:
          - **Overview**: A general guideline on the nutritional approach considering the user's diet preference, restrictions, meal frequency, and water intake.
          - **Nutritional Timing**: Recommendations on when to consume proteins, fats, carbohydrates, and other nutrients around workouts. \n`;
        hasProvidedInitialExerciseDetails = true;
      } else {
        systemMessageSegment = `**Week ${currentWeek} Diet Breakdown**:
              - Primary nutritional focus or theme for the week.
              - **Day-by-Day Breakdown**:
                  - For each day, provide:
                      - Daily meal recommendations, considering any food allergies.
                      - Suggestions for supplements, if any. \n`;
      }
      break
    case "mentalWellbeing":
      systemMessageSegment = "Incorporate a section titled 'Mental Wellbeing'. Provide tips on stress management, the benefits of meditation, and relaxation techniques.\n";
      break;
    case "progressTracking":
      systemMessageSegment = "Add a 'Progress Tracking' section. Offer guidelines on how users can track their progress and recommend tools or apps.\n";
      break;
    case "recoveryRest":
      systemMessageSegment = "Detail a 'Recovery and Rest' section. Emphasize recovery, provide strategies for optimizing sleep, and suggest relaxation techniques post-workout.\n";
      break;
    case "safetyPrecautions":
      systemMessageSegment = "Include a 'Safety Precautions' section. This should offer guidelines on safe exercise practices and scenarios when it's best to consult a professional.\n";
      break;
    case "nutritionTips":
      systemMessageSegment = "Lastly, incorporate a 'Nutrition Tips and Recipes' section. Offer quick healthy recipes, snack ideas, and general nutrition advice.\n";
      break;
    default:
      console.log("All sections completed.");
      return;
  }

  messageHistory.push({ role: "user", content: userMessage });


  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: 'system', content: `You are Fitness GPT, a highly renowned health and nutrition expert. Based on the user's profile and preferences, create a detailed and custom diet and exercise plan broken down week-by-week and day by day. Adhere structured format of each system prompt, including titles provided` },
      ...messageHistory,
      { role: "system", content: systemMessageSegment }
    ],
    stream: true,
  });

  let assistantResponseBuffer = '';
  for await (const chunk of completion) {
    if (chunk.choices[0].delta.content) {
      processChunk(chunk.choices[0].delta.content);
      assistantResponseBuffer += chunk.choices[0].delta.content;
    }
  }
  messageHistory.push({ role: "assistant", content: assistantResponseBuffer });

  // Transition to the next section based on your plan
  const totalWeeks = Number(getFormData(form).timeframe);
  switch (stage) {
    case "introduction":
      currentWeek = 1; // Reset currentWeek to 1 here
      streamOpenAIResponse('exercise', currentWeek, hasProvidedInitialExerciseDetails);
      break;
    case "exercise":
      if (!hasProvidedInitialExerciseDetails) {
        hasProvidedInitialExerciseDetails = true;
        streamOpenAIResponse('exercise', currentWeek, hasProvidedInitialExerciseDetails);
      } else if (currentWeek < totalWeeks) {
        currentWeek += 1;
        streamOpenAIResponse('exercise', currentWeek, hasProvidedInitialExerciseDetails);
      } else {
        currentWeek = 1; // Reset currentWeek to 1 before starting the diet section
        streamOpenAIResponse('diet', currentWeek);
      }
      break;
    case "diet":
      if (!hasProvidedInitialExerciseDetails) {
        hasProvidedInitialExerciseDetails = true;
        streamOpenAIResponse('diet', currentWeek, hasProvidedInitialExerciseDetails);
      } else if (currentWeek < totalWeeks) {
        currentWeek += 1;
        streamOpenAIResponse('diet', currentWeek, hasProvidedInitialExerciseDetails);
      } else {
        streamOpenAIResponse('nutritionTips', currentWeek);
      }
      break;
    case 'nutritionTips':
      streamOpenAIResponse('mentalWellbeing', currentWeek, hasProvidedInitialExerciseDetails);
      break;
    case "mentalWellbeing":
      streamOpenAIResponse('progressTracking', currentWeek, hasProvidedInitialExerciseDetails);
      break;
    case "progressTracking":
      streamOpenAIResponse('recoveryRest'), currentWeek, hasProvidedInitialExerciseDetails;
      break;
    case "recoveryRest":
      streamOpenAIResponse('safetyPrecautions', currentWeek, hasProvidedInitialExerciseDetails);
      break;
    case "safetyPrecautions":
      streamOpenAIResponse('nutritionTips', currentWeek, hasProvidedInitialExerciseDetails);
      break;
    default:
      const markdownContainer = document.getElementById('markdownContainer') as HTMLElement;
      markdownContainer.appendChild(createDisclaimer());
      const backButton = document.createElement('button');
      backButton.className = 'bg-blue-500 text-white p-2 rounded mt-4';
      backButton.textContent = 'Go Back';
      backButton.onclick = () => {
        app.innerHTML = ''
        app.appendChild(formElement)
      };
      app.appendChild(backButton);

      const exportButton = document.createElement('button');
      exportButton.className = 'bg-blue-500 text-white p-2 rounded mt-4 mr-2';
      exportButton.textContent = 'Export';
      exportButton.onclick = () => exportPlan();
      app.appendChild(exportButton);


      const printButton = document.createElement('button');
      printButton.className = 'bg-blue-500 text-white p-2 rounded mt-4';
      printButton.textContent = 'Print';
      printButton.onclick = () => window.print();
      app.appendChild(printButton);
      loadingText.style.display = 'none';
      break;
  }


}

function getFormData(formInstance: FitnessGPTForm): Record<string, any> {
  const data: Record<string, any> = {};

  formInstance.formFields.forEach(field => {
    const element = formInstance.domReferences[field.id];

    if (!element) {
      console.warn(`Element with ID "${field.id}" not found.`);
      return;
    }

    switch (field.type) {
      case 'text':
      case 'number':
      case 'tel':
      case 'url':
      case 'email':
      case 'textarea':
        data[field.id] = (element as HTMLInputElement).value;
        break;
      case 'select':
        data[field.id] = (element as HTMLSelectElement).value;
        break;
      case 'radio':
      case 'checkbox':
        const checkedElement = document.querySelector(`input[name="${field.id}"]:checked`);
        if (checkedElement) {
          data[field.id] = (checkedElement as HTMLInputElement).value;
        }
        break;
    }

    // Handle subFields
    if (field.subFields) {
      field.subFields.forEach(subField => {
        const subElement = formInstance.domReferences[subField.id];
        if (subElement) {
          data[subField.id] = (subElement as HTMLInputElement).value;
        }
      });
    }
  });

  return data;
}



let markdownBuffer = '';
function processChunk(chunk: string) {
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

function renderMarkdown(markdown: string) {
  // If the markdown container doesn't exist, create it and the back button.
  if (!document.getElementById('markdownContainer')) {

    const markdownContainer = document.createElement('div');
    markdownContainer.id = 'markdownContainer';
    markdownContainer.className = 'bg-white p-8 rounded-lg shadow-md w-3/4';
    app.appendChild(markdownContainer);

  }

  // Append the markdown chunk to the existing markdown container
  const markdownContainer = document.getElementById('markdownContainer');
  if (markdownContainer) {
    markdownContainer.innerHTML += md.render(markdown);
  }
}

renderLandingPage();
const formElement = document.createElement('div');
formElement.className = 'bg-white p-8 rounded-lg shadow-md w-1/2 mx-auto mt-10';
formElement.style.display = 'none'; // initially hidden

app.appendChild(formElement);
const form = new FitnessGPTForm(formElement);
form.render();

function createDisclaimer(): HTMLElement {
  const disclaimer = document.createElement('p');
  disclaimer.className = 'text-sm mt-4 italic';
  disclaimer.textContent = 'Disclaimer: The provided fitness plan is a suggestion generated by an AI and is intended for informational purposes only. Always consult with a healthcare or fitness professional before starting any new exercise or diet program. Use this plan at your own risk. The creators and maintainers of this tool will not be held legally or criminally liable for any injuries, health complications, or other adverse effects that may arise from following the plan. Remember to always listen to your body and know your limits.';
  return disclaimer;
}

function exportPlan() {
  const blob = new Blob([document.getElementById('markdownContainer')?.textContent ?? ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FitnessPlan.txt';
  a.click();
  URL.revokeObjectURL(url);
}


// APPLICATION CONSTANTS AND CONFIGURATION
const SUPABASE_URL = 'https://trpigpfligemnmeybhmw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGlncGZsaWdlbW5tZXliaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTcyOTcsImV4cCI6MjA4MTg5MzI5N30.DPKrT9KPMHKxejTcE-8M9I1pPH9aF6QjTWdPI_pNPRkapikey';

// Initialize Supabase client safely
let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase client initialized successfully");
    } else {
        console.error("Supabase library not loaded");
    }
} catch (error) {
    console.error("Error initializing Supabase:", error);
}

// GLOBAL STATE MANAGEMENT
let notes = JSON.parse(localStorage.getItem('ghostNotes')) || [];
let currentNoteId = null;
let saveTimeout = null;
let currentUser = null;
let localUserName = localStorage.getItem('ghost_offline_user');
let selectedExportTheme = 'light';
let activePreviewNoteId = null;
let isSelectionMode = false;
let selectedNoteIds = new Set();
let modalCallback = null;
let currentTemplateCategory = 'all';
let isGuestMode = localStorage.getItem('isGuestMode') === 'true';
let authMode = 'login'; // 'login' or 'signup'

// Track list states for toggle functionality
let bulletListActive = false;
let numberListActive = false;

// PREDEFINED TEMPLATES DATABASE
const templates = [
    {
        id: 1,
        title: "Meeting Notes",
        category: "work",
        icon: "fa-solid fa-users",
        description: "Structured template for meeting discussions",
        preview: "Agenda, Decisions, Action Items",
        content: `<h2 style="color: #5f6ad4">Meeting Notes</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
<p><strong>Attendees:</strong> </p>
<hr>
<h3>📋 Agenda</h3>
<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>
<h3>💬 Discussion Points</h3>
<ul>
<li><strong>Point 1:</strong> </li>
<li><strong>Point 2:</strong> </li>
<li><strong>Point 3:</strong> </li>
</ul>
<h3>✅ Decisions Made</h3>
<ul>
<li>Decision 1</li>
<li>Decision 2</li>
</ul>
<h3>🎯 Action Items</h3>
<ul>
<li><strong>IMP: </strong> Task 1 - Owner: - Deadline: </li>
<li><strong>IMP: </strong> Task 2 - Owner: - Deadline: </li>
</ul>
<h3>📅 Next Meeting</h3>
<p>Date: - Time: - Agenda: </p>`
    },
    {
        id: 2,
        title: "Project Plan",
        category: "work",
        icon: "fa-solid fa-project-diagram",
        description: "Comprehensive project planning template",
        preview: "Goals, Timeline, Resources",
        content: `<h1 style="color: #5f6ad4">Project Plan: [Project Name]</h1>
<p><strong>Created:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
<hr>
<h2>🎯 Project Overview</h2>
<p><strong>Project Name:</strong> </p>
<p><strong>Objective:</strong> </p>
<p><strong>Success Metrics:</strong> </p>
<ul>
<li>Metric 1</li>
<li>Metric 2</li>
<li>Metric 3</li>
</ul>
<h2>👥 Team & Roles</h2>
<ul>
<li><strong>Project Lead:</strong> </li>
<li><strong>Team Members:</strong> </li>
<li><strong>Stakeholders:</strong> </li>
</ul>
<h2>📅 Timeline</h2>
<h3>Phase 1: Planning (Week 1-2)</h3>
<ul>
<li><strong>TODO: </strong> Define scope and objectives</li>
<li><strong>TODO: </strong> Gather requirements</li>
<li><strong>TODO: </strong> Create project plan</li>
</ul>
<h3>Phase 2: Execution (Week 3-6)</h3>
<ul>
<li><strong>TODO: </strong> Develop core features</li>
<li><strong>TODO: </strong> Weekly progress reviews</li>
<li><strong>TODO: </strong> Testing and feedback</li>
</ul>
<h3>Phase 3: Launch (Week 7-8)</h3>
<ul>
<li><strong>TODO: </strong> Final testing</li>
<li><strong>TODO: </strong> Deployment</li>
<li><strong>TODO: </strong> Post-launch review</li>
</ul>
<h2>💰 Resources & Budget</h2>
<ul>
<li>Budget: $</li>
<li>Tools: </li>
<li>Other Resources: </li>
</ul>
<h2>⚠️ Risks & Mitigations</h2>
<ul>
<li><strong>Risk 1:</strong>  - <strong>Mitigation:</strong> </li>
<li><strong>Risk 2:</strong>  - <strong>Mitigation:</strong> </li>
</ul>`
    },
    {
        id: 3,
        title: "Daily Journal",
        category: "personal",
        icon: "fa-solid fa-book",
        description: "Reflective journal for daily thoughts",
        preview: "Gratitude, Highlights, Learnings",
        content: `<h1 style="color: #5f6ad4; text-align: center">Daily Journal</h1>
<h2 style="text-align: center">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
<hr>
<h3>🌅 Morning Reflections</h3>
<p><strong>How am I feeling this morning?</strong></p>
<p></p>
<p><strong>What am I looking forward to today?</strong></p>
<p></p>
<h3>🙏 Gratitude (3 things)</h3>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<h3>🎯 Daily Intentions</h3>
<ul>
<li><strong>Main Focus:</strong> </li>
<li><strong>Secondary Tasks:</strong> </li>
<li><strong>Personal Goal:</strong> </li>
</ul>
<hr>
<h3>🌇 Evening Reflections</h3>
<p><strong>How did the day go?</strong></p>
<p></p>
<p><strong>Today's Highlights:</strong></p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<p><strong>Challenges faced:</strong></p>
<ul>
<li></li>
<li></li>
</ul>
<h3>📚 Learnings & Insights</h3>
<p><strong>What did I learn today?</strong></p>
<p></p>
<p><strong>What could I have done better?</strong></p>
<p></p>
<h3>🌈 Tomorrow's Focus</h3>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h3>💭 Final Thoughts</h3>
<p></p>`
    },
    {
        id: 4,
        title: "Lecture Notes",
        category: "study",
        icon: "fa-solid fa-graduation-cap",
        description: "Academic lecture note-taking template",
        preview: "Key Concepts, Questions, Summary",
        content: `<h1 style="color: #5f6ad4">Lecture Notes</h1>
<h2>📚 Subject: </h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
<p><strong>Instructor:</strong> </p>
<p><strong>Topic:</strong> </p>
<hr>
<h2>🎯 Learning Objectives</h2>
<ul>
<li>Objective 1</li>
<li>Objective 2</li>
<li>Objective 3</li>
</ul>
<h2>📝 Key Concepts</h2>
<h3>Concept 1:</h3>
<p><strong>Definition:</strong> </p>
<p><strong>Explanation:</strong> </p>
<p><strong>Example:</strong> </p>
<h3>Concept 2:</h3>
<p><strong>Definition:</strong> </p>
<p><strong>Explanation:</strong> </p>
<p><strong>Example:</strong> </p>
<h2>❓ Questions & Clarifications</h2>
<ul>
<li><strong>Que: </strong> Question 1</li>
<li><strong>Que: </strong> Question 2</li>
<li><strong>Que: </strong> Question 3</li>
</ul>
<h2>🔗 Connections to Previous Material</h2>
<ul>
<li>Connection 1</li>
<li>Connection 2</li>
</ul>
<h2>📋 Important Formulas/Equations</h2>
<ul>
<li>Formula 1: </li>
<li>Formula 2: </li>
<li>Formula 3: </li>
</ul>
<h2>💡 Real-World Applications</h2>
<ul>
<li>Application 1</li>
<li>Application 2</li>
</ul>
<h2>📚 Recommended Reading</h2>
<ul>
<li>Reading 1</li>
<li>Reading 2</li>
</ul>
<h2>✅ Summary & Takeaways</h2>
<p><strong>Main Points:</strong></p>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<p><strong>Why this matters:</strong></p>
<p></p>
<h2>📝 Homework/Assignments</h2>
<ul>
<li><strong>TODO: </strong> Assignment 1 - Due: </li>
<li><strong>TODO: </strong> Assignment 2 - Due: </li>
</ul>`
    },
    {
        id: 5,
        title: "Brainstorming Session",
        category: "creative",
        icon: "fa-solid fa-lightbulb",
        description: "Template for creative idea generation",
        preview: "Ideas, Evaluation, Next Steps",
        content: `<h1 style="color: #5f6ad4">Brainstorming Session</h1>
<h2>💡 Topic/Problem: </h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
<p><strong>Participants:</strong> </p>
<hr>
<h2>🎯 Session Goal</h2>
<p><strong>What are we trying to solve/create?</strong></p>
<p></p>
<p><strong>Success Criteria:</strong></p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>🚀 Warm-up Exercise</h2>
<p><strong>Quick Ideas (1-minute each):</strong></p>
<ul>
<li>Idea 1</li>
<li>Idea 2</li>
<li>Idea 3</li>
</ul>
<h2>🌈 Divergent Thinking - All Ideas Welcome!</h2>
<p><em>No filtering, just write everything that comes to mind</em></p>
<h3>Category 1: </h3>
<ul>
<li>Idea</li>
<li>Idea</li>
<li>Idea</li>
</ul>
<h3>Category 2: </h3>
<ul>
<li>Idea</li>
<li>Idea</li>
<li>Idea</li>
</ul>
<h3>Category 3: </h3>
<ul>
<li>Idea</li>
<li>Idea</li>
<li>Idea</li>
</ul>
<h3>Wild & Crazy Ideas:</h3>
<ul>
<li>!</li>
<li>!</li>
<li>!</li>
</ul>
<hr>
<h2>🎯 Convergent Thinking - Filtering Ideas</h2>
<h3>Evaluation Criteria:</h3>
<ul>
<li><strong>Feasibility:</strong> Can we do this?</li>
<li><strong>Impact:</strong> Will this solve the problem?</li>
<li><strong>Resources:</strong> What do we need?</li>
<li><strong>Time:</strong> How long will it take?</li>
</ul>
<h3>Top 3 Ideas:</h3>
<ol>
<li><strong>Idea:</strong> </li>
<li><strong>Pros:</strong> </li>
<li><strong>Cons:</strong> </li>
<li><strong>Next Steps:</strong> </li>
</ol>
<ol start="2">
<li><strong>Idea:</strong> </li>
<li><strong>Pros:</strong> </li>
<li><strong>Cons:</strong> </li>
<li><strong>Next Steps:</strong> </li>
</ol>
<ol start="3">
<li><strong>Idea:</strong> </li>
<li><strong>Pros:</strong> </li>
<li><strong>Cons:</strong> </li>
<li><strong>Next Steps:</strong> </li>
</ol>
<h2>📝 Action Plan</h2>
<ul>
<li><strong>TODO: </strong> Research top idea - Owner:  - Deadline: </li>
<li><strong>TODO: </strong> Create prototype - Owner:  - Deadline: </li>
<li><strong>TODO: </strong> Schedule follow-up - Date: </li>
</ul>
<h2>💭 Reflections</h2>
<p><strong>What worked well:</strong></p>
<p></p>
<p><strong>What could be improved:</strong></p>
<p></p>`
    },
    {
        id: 6,
        title: "Book Notes",
        category: "study",
        icon: "fa-solid fa-book-open",
        description: "Template for summarizing and analyzing books",
        preview: "Summary, Quotes, Takeaways",
        content: `<h1 style="color: #5f6ad4">Book Notes</h1>
<h2>📖 Book Title: </h2>
<p><strong>Author:</strong> </p>
<p><strong>Date Read:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
<p><strong>Genre:</strong> </p>
<hr>
<h2>🎯 Why I Read This Book</h2>
<p></p>
<h2>📝 Summary (In My Own Words)</h2>
<h3>Main Thesis/Argument:</h3>
<p></p>
<h3>Key Supporting Points:</h3>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<h2>💡 Key Concepts & Ideas</h2>
<h3>Concept 1:</h3>
<p><strong>Explanation:</strong> </p>
<p><strong>Example/Application:</strong> </p>
<h3>Concept 2:</h3>
<p><strong>Explanation:</strong> </p>
<p><strong>Example/Application:</strong> </p>
<h2>🌟 Memorable Quotes</h2>
<blockquote style="border-left: 4px solid #5f6ad4; padding-left: 15px; margin-left: 0; font-style: italic;">
"Quote 1"
</blockquote>
<p><strong>Page:</strong>  - <strong>Why it resonates:</strong> </p>
<blockquote style="border-left: 4px solid #5f6ad4; padding-left: 15px; margin-left: 0; font-style: italic;">
"Quote 2"
</blockquote>
<p><strong>Page:</strong>  - <strong>Why it resonates:</strong> </p>
<h2>❓ Questions & Critiques</h2>
<ul>
<li><strong>Que: </strong> Question 1</li>
<li><strong>Que: </strong> Question 2</li>
<li><strong>Que: </strong> What didn't I agree with?</li>
</ul>
<h2>🔗 Connections to Other Ideas</h2>
<ul>
<li>Connection to [Other Book/Concept]: </li>
<li>Connection to Personal Experience: </li>
<li>Connection to Current Events: </li>
</ul>
<h2>🚀 Practical Applications</h2>
<h3>For Work/Projects:</h3>
<ul>
<li>Application 1</li>
<li>Application 2</li>
</ul>
<h3>For Personal Life:</h3>
<ul>
<li>Application 1</li>
<li>Application 2</li>
</ul>
<h2>📊 Evaluation</h2>
<p><strong>Overall Rating:</strong> ⭐⭐⭐⭐⭐ (5/5)</p>
<p><strong>Strengths:</strong></p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<p><strong>Weaknesses:</strong></p>
<ul>
<li></li>
<li></li>
</ul>
<h2>✅ Key Takeaways</h2>
<ol>
<li><strong>NOTE: </strong> Takeaway 1</li>
<li><strong>NOTE: </strong> Takeaway 2</li>
<li><strong>NOTE: </strong> Takeaway 3</li>
</ol>
<h2>📚 Recommended For</h2>
<p>This book is ideal for:</p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>🔍 Further Reading</h2>
<ul>
<li>Related Book 1: </li>
<li>Related Book 2: </li>
<li>Author's Other Works: </li>
</ul>`
    },
    {
        id: 7,
        title: "Weekly Review",
        category: "personal",
        icon: "fa-solid fa-chart-line",
        description: "Template for weekly reflection and planning",
        preview: "Accomplishments, Learnings, Next Week",
        content: `<h1 style="color: #5f6ad4; text-align: center">Weekly Review</h1>
<h2 style="text-align: center">Week of: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
<hr>
<h2>🎯 Weekly Intentions (What I planned)</h2>
<ul>
<li>Intention 1: </li>
<li>Intention 2: </li>
<li>Intention 3: </li>
</ul>
<h2>✅ Accomplishments & Wins</h2>
<h3>Professional:</h3>
<ul>
<li>✓ </li>
<li>✓ </li>
<li>✓ </li>
</ul>
<h3>Personal:</h3>
<ul>
<li>✓ </li>
<li>✓ </li>
<li>✓ </li>
</ul>
<h3>Health & Wellness:</h3>
<ul>
<li>✓ </li>
<li>✓ </li>
<li>✓ </li>
</ul>
<h2>📊 Metrics & Numbers</h2>
<ul>
<li>Hours worked: </li>
<li>Meetings attended: </li>
<li>Tasks completed: </li>
<li>Exercise days: </li>
<li>Books/pages read: </li>
</ul>
<h2>🌟 Highlights & Peak Moments</h2>
<ol>
<li><strong>Moment 1:</strong> </li>
<li><strong>Moment 2:</strong> </li>
<li><strong>Moment 3:</strong> </li>
</ol>
<h2>🌀 Challenges & Difficulties</h2>
<ul>
<li><strong>Challenge 1:</strong>  - <strong>What I learned:</strong> </li>
<li><strong>Challenge 2:</strong>  - <strong>What I learned:</strong> </li>
<li><strong>Challenge 3:</strong>  - <strong>What I learned:</strong> </li>
</ul>
<h2>📚 Learnings & Insights</h2>
<h3>About Work:</h3>
<p></p>
<h3>About Myself:</h3>
<p></p>
<h3>About Others:</h3>
<p></p>
<h2>🙏 Gratitude</h2>
<p><strong>People I'm grateful for:</strong></p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<p><strong>Experiences I'm grateful for:</strong></p>
<ul>
<li></li>
<li></li>
</ul>
<h2>🔍 Areas for Improvement</h2>
<ul>
<li><strong>FIX: </strong> Area 1</li>
<li><strong>FIX: </strong> Area 2</li>
<li><strong>FIX: </strong> Area 3</li>
</ul>
<hr>
<h2>📅 Planning for Next Week</h2>
<h3>Big Rocks (Most Important Tasks):</h3>
<ol>
<li><strong>IMP: </strong> </li>
<li><strong>IMP: </strong> </li>
<li><strong>IMP: </strong> </li>
</ol>
<h3>Focus Areas:</h3>
<ul>
<li>Focus 1: </li>
<li>Focus 2: </li>
<li>Focus 3: </li>
</ul>
<h3>Habits to Strengthen:</h3>
<ul>
<li>Habit 1: </li>
<li>Habit 2: </li>
</ul>
<h3>Self-Care Commitments:</h3>
<ul>
<li>Commitment 1: </li>
<li>Commitment 2: </li>
</ul>
<h2>💭 Final Reflections</h2>
<p><strong>Overall week rating:</strong> ⭐⭐⭐⭐⭐ (5/5)</p>
<p><strong>One word to describe this week:</strong> </p>
<p><strong>How I want to feel next week:</strong> </p>`
    },
    {
        id: 8,
        title: "Interview Preparation",
        category: "work",
        icon: "fa-solid fa-briefcase",
        description: "Template for job interview preparation",
        preview: "Research, Questions, Strategy",
        content: `<h1 style="color: #5f6ad4">Interview Preparation</h1>
<h2>🏢 Company: </h2>
<p><strong>Position:</strong> </p>
<p><strong>Interview Date:</strong> </p>
<p><strong>Interviewer(s):</strong> </p>
<hr>
<h2>🔍 Company Research</h2>
<h3>About the Company:</h3>
<p><strong>Mission & Values:</strong> </p>
<p><strong>Recent News/Developments:</strong> </p>
<p><strong>Products/Services:</strong> </p>
<p><strong>Competitors:</strong> </p>
<h3>Team/Department:</h3>
<p><strong>Team Structure:</strong> </p>
<p><strong>Key People:</strong> </p>
<h2>🎯 Position Analysis</h2>
<p><strong>Key Responsibilities:</strong></p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<p><strong>Required Skills:</strong></p>
<ul>
<li>Skill 1</li>
<li>Skill 2</li>
<li>Skill 3</li>
</ul>
<p><strong>Why I'm Interested:</strong></p>
<p></p>
<p><strong>How I Can Contribute:</strong></p>
<p></p>
<h2>💼 My Qualifications</h2>
<h3>Relevant Experience:</h3>
<ul>
<li>Experience 1: </li>
<li>Experience 2: </li>
<li>Experience 3: </li>
</ul>
<h3>Key Achievements:</h3>
<ul>
<li>Achievement 1 (with metrics if possible)</li>
<li>Achievement 2</li>
<li>Achievement 3</li>
</ul>
<h3>Skills Match:</h3>
<ul>
<li><strong>Skill:</strong>  - <strong>Example/Proof:</strong> </li>
<li><strong>Skill:</strong>  - <strong>Example/Proof:</strong> </li>
<li><strong>Skill:</strong>  - <strong>Example/Proof:</strong> </li>
</ul>
<h2>❓ Questions to Ask Them</h2>
<h3>About the Role:</h3>
<ul>
<li><strong>Que: </strong> What does success look like in this position in 6 months?</li>
<li><strong>Que: </strong> What are the biggest challenges facing this team/department?</li>
<li><strong>Que: </strong> How is performance measured?</li>
</ul>
<h3>About the Company:</h3>
<ul>
<li><strong>Que: </strong> What excites you most about the company's future?</li>
<li><strong>Que: </strong> How does the company support professional development?</li>
<li><strong>Que: </strong> What's the team culture like?</li>
</ul>
<h2>💬 Expected Interview Questions</h2>
<h3>Common Questions:</h3>
<ul>
<li><strong>"Tell me about yourself"</strong> - <strong>Ans: </strong> </li>
<li><strong>"Why do you want to work here?"</strong> - <strong>Ans: </strong> </li>
<li><strong>"What are your strengths/weaknesses?"</strong> - <strong>Ans: </strong> </li>
</ul>
<h3>Behavioral Questions (STAR method):</h3>
<ul>
<li><strong>"Describe a challenging project"</strong> - <strong>Ans: </strong> </li>
<li><strong>"Tell me about a time you failed"</strong> - <strong>Ans: </strong> </li>
<li><strong>"Describe a conflict with a coworker"</strong> - <strong>Ans: </strong> </li>
</ul>
<h3>Technical/Position-Specific:</h3>
<ul>
<li>Question 1 - <strong>Ans: </strong> </li>
<li>Question 2 - <strong>Ans: </strong> </li>
</ul>
<h2>🎯 Interview Strategy</h2>
<p><strong>Key Points to Emphasize:</strong></p>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<p><strong>What to Avoid:</strong></p>
<ul>
<li></li>
<li></li>
</ul>
<p><strong>Desired Outcome:</strong></p>
<p></p>
<h2>📝 Logistics & Preparation</h2>
<ul>
<li><strong>TODO: </strong> Confirm time and location/video link</li>
<li><strong>TODO: </strong> Prepare attire</li>
<li><strong>TODO: </strong> Test technology (if virtual)</li>
<li><strong>TODO: </strong> Print resumes/portfolio</li>
<li><strong>TODO: </strong> Prepare questions list to bring</li>
</ul>
<h2>✅ Post-Interview Actions</h2>
<ul>
<li>Send thank-you email within 24 hours</li>
<li>Note any follow-up items promised</li>
<li>Record thoughts and reflections immediately after</li>
</ul>`
    }
];

// DOM ELEMENT REFERENCES - THEME AND DATE
const themeBtns = document.querySelectorAll('.theme-btn-ref');
const dateDisplay = document.getElementById('current-date');

// DOM ELEMENT REFERENCES - WRITER VIEW
const writerArea = document.getElementById('writer-area');
const titleInput = document.getElementById('note-title');
const saveStatus = document.getElementById('save-status');
const wordCountBadge = document.getElementById('word-count');

// DOM ELEMENT REFERENCES - MODAL COMPONENTS
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');
const modalConfirmBtn = document.getElementById('modal-confirm');
const modalCancelBtn = document.getElementById('modal-cancel');
const exportModal = document.getElementById('export-modal');
const btnExportSelected = document.getElementById('btn-export-selected');
const btnCancelExport = document.getElementById('btn-cancel-export');
const btnConfirmExport = document.getElementById('btn-confirm-export');
const exportFilenameInput = document.getElementById('export-filename');
const themeOptions = document.querySelectorAll('.theme-option');

// NEW AUTH MODAL REFERENCES
const authModal = document.getElementById('auth-modal');
const authNavBtns = document.querySelectorAll('.auth-nav-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginUsernameInput = document.getElementById('login-username');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
const signupError = document.getElementById('signup-error');
const authCancelBtn = document.getElementById('auth-cancel');
const authProceedBtn = document.getElementById('auth-proceed');

// GUEST MODAL REFERENCES
const guestModal = document.getElementById('guest-modal');
const guestUsernameInput = document.getElementById('guest-username');
const guestError = document.getElementById('guest-error');
const guestCancelBtn = document.getElementById('guest-cancel');
const guestProceedBtn = document.getElementById('guest-proceed');

// LOGOUT BUTTON
const btnLogout = document.getElementById('btn-logout');
const dashBtnContainer = document.getElementById('dash-btn-container');

// TEMPLATE MODAL REFERENCES
const templateModal = document.getElementById('template-modal');
const btnOpenTemplates = document.getElementById('btn-open-templates');
const templateGrid = document.getElementById('template-grid');
const categoryBtns = document.querySelectorAll('.category-btn');
const btnCloseTemplate = document.getElementById('btn-close-template');

// TOOLBAR REFERENCES
const toolbarBelt = document.getElementById('toolbar-belt');
const colorBtns = document.querySelectorAll('.color-btn');
const formatBtns = document.querySelectorAll('.format-btn');
const textPills = document.querySelectorAll('.text-pill');

// PREVIEW SHEET REFERENCES
const previewSheet = document.getElementById('mobile-preview-sheet');
const previewOverlay = document.getElementById('mobile-preview-overlay');
const sheetCloseBtn = document.getElementById('sheet-close-btn');
const sheetEditBtn = document.getElementById('sheet-edit-btn');
const sheetTitle = document.getElementById('sheet-title');
const sheetDate = document.getElementById('sheet-date');
const sheetBody = document.getElementById('sheet-body');

// VIEW NAVIGATION REFERENCES
const pageLoader = document.getElementById('page-loader');
const viewIntro = document.getElementById('view-intro');
const viewDashboard = document.getElementById('view-dashboard');
const viewHome = document.getElementById('view-home');
const viewHistory = document.getElementById('view-history');
const viewBin = document.getElementById('view-bin');
const btnLetsGo = document.getElementById('btn-lets-go');
const btnExit = document.getElementById('btn-exit');
const btnDashBack = document.getElementById('btn-dashboard-back');
const btnDashboardHistory = document.getElementById('btn-dashboard-history');
const btnBackFromHistory = document.getElementById('btn-back-to-dashboard');
const btnDashboardBin = document.getElementById('btn-dashboard-bin');
const btnBackFromBin = document.getElementById('btn-back-from-bin');
const btnNewNoteMob = document.getElementById('btn-new-note-mob');
const btnOpenBinMob = document.getElementById('btn-open-bin-mob');

// GRID DISPLAY REFERENCES
const dashboardCards = document.getElementById('dashboard-cards');
const notesGrid = document.getElementById('notes-grid');
const emptyMsg = document.getElementById('empty-history-msg');
const btnSelectMode = document.getElementById('btn-select-mode');
const btnDeleteSelected = document.getElementById('btn-delete-selected');
const selectedCountSpan = document.getElementById('selected-count');
const binGrid = document.getElementById('bin-grid');
const emptyBinMsg = document.getElementById('empty-bin-msg');
const btnEmptyBin = document.getElementById('btn-empty-bin');

// GUEST BUTTON REFERENCES
const guestBtnIntro = document.getElementById('guest-btn-intro');

// THEME MANAGEMENT FUNCTIONS
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const todayStr = new Date().toLocaleDateString('en-US', options);
if (dateDisplay) dateDisplay.innerText = todayStr;

function updateThemeText() {
    const isDark = document.documentElement.classList.contains('dark');
    themeBtns.forEach(btn => {
        const span = btn.querySelector('.theme-text-span');
        if (span) span.innerText = isDark ? "Night" : "Day";
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeText();
}

function initThemeToggle() {
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const isDark = document.documentElement.classList.contains('dark');
            const x = event.clientX;
            const y = event.clientY;

            if (document.startViewTransition) {
                const endRadius = Math.hypot(
                    Math.max(x, innerWidth - x),
                    Math.max(y, innerHeight - y)
                );

                const transition = document.startViewTransition(() => {
                    document.documentElement.classList.toggle('dark');
                    updateThemeText();
                    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                });

                transition.ready.then(() => {
                    document.documentElement.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${endRadius}px at ${x}px ${y}px)`
                            ]
                        },
                        {
                            duration: 700,
                            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
                            pseudoElement: '::view-transition-new(root)'
                        }
                    );
                });
            } else {
                document.documentElement.classList.toggle('dark');
                updateThemeText();
                localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            }
        });
    });
}

// AUTH MODAL FUNCTIONS
function showAuthModal() {
    authModal.classList.remove('hidden');
    resetAuthForms();
}

function hideAuthModal() {
    authModal.classList.add('hidden');
    resetAuthForms();
}

function switchAuthMode(mode) {
    authMode = mode;

    // Update navigation buttons
    authNavBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update forms visibility
    if (mode === 'login') {
        loginForm.classList.add('active-form');
        signupForm.classList.remove('active-form');
        if (loginUsernameInput) loginUsernameInput.focus();
    } else {
        loginForm.classList.remove('active-form');
        signupForm.classList.add('active-form');
        if (signupEmailInput) signupEmailInput.focus();
    }
}

function resetAuthForms() {
    // Clear inputs
    if (loginUsernameInput) loginUsernameInput.value = '';
    if (loginEmailInput) loginEmailInput.value = '';
    if (loginPasswordInput) loginPasswordInput.value = '';
    if (signupEmailInput) signupEmailInput.value = '';
    if (signupPasswordInput) signupPasswordInput.value = '';
    if (signupConfirmPasswordInput) signupConfirmPasswordInput.value = '';

    // Clear errors
    if (loginError) {
        loginError.textContent = '';
        loginError.classList.add('hidden');
    }
    if (signupError) {
        signupError.textContent = '';
        signupError.classList.add('hidden');
    }
}

function validateLoginForm() {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email) {
        loginError.textContent = 'Email is required';
        loginError.classList.remove('hidden');
        return false;
    }

    if (!password || password.length < 6) {
        loginError.textContent = 'Password must be at least 6 characters';
        loginError.classList.remove('hidden');
        return false;
    }

    loginError.classList.add('hidden');
    return true;
}

function validateSignupForm() {
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPassword = signupConfirmPasswordInput.value;

    if (!email) {
        signupError.textContent = 'Email is required';
        signupError.classList.remove('hidden');
        return false;
    }

    if (!email.includes('@')) {
        signupError.textContent = 'Please enter a valid email';
        signupError.classList.remove('hidden');
        return false;
    }

    if (!password || password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters';
        signupError.classList.remove('hidden');
        return false;
    }

    if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        signupError.classList.remove('hidden');
        return false;
    }

    signupError.classList.add('hidden');
    return true;
}

// ────────────────────────────────────────────────────────
// SUPABASE AUTHENTICATION INTEGRATION
// ────────────────────────────────────────────────────────

async function handleLogin() {
    if (!validateLoginForm()) return;

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;
    const username = loginUsernameInput ? loginUsernameInput.value.trim() : email.split('@')[0];

    if (loginError) loginError.textContent = "Logging in...";
    if (loginError) loginError.classList.remove('hidden');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        currentUser = data.user;
        isGuestMode = false;
        localStorage.setItem('isGuestMode', 'false');
        localStorage.setItem('ghost_user', JSON.stringify(currentUser));

        hideAuthModal();

        // Update UI
        if (btnLogout) btnLogout.classList.remove('hidden');
        handleGridClass(true);

        // Fetch real cloud notes
        await fetchNotesFromCloud();

        // Go to dashboard
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('dashboard');

    } catch (error) {
        console.error("Login error:", error);
        if (loginError) {
            loginError.textContent = error.message || "Login failed. Please try again.";
            loginError.classList.remove('hidden');
        }
    }
}

async function handleSignup() {
    if (!validateSignupForm()) return;

    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;

    if (signupError) signupError.textContent = "Creating account...";
    if (signupError) signupError.classList.remove('hidden');

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;

        alert("Check your email for the confirmation link!");
        switchAuthMode('login');

    } catch (error) {
        console.error("Signup error:", error);
        if (signupError) {
            signupError.textContent = error.message || "Signup failed. Please try again.";
            signupError.classList.remove('hidden');
        }
    }
}

// GUEST MODAL FUNCTIONS
function showGuestModal() {
    guestModal.classList.remove('hidden');
    if (guestUsernameInput) guestUsernameInput.focus();
}

function hideGuestModal() {
    guestModal.classList.add('hidden');
    if (guestError) {
        guestError.textContent = '';
        guestError.classList.add('hidden');
    }
}

function handleGuestLogin() {
    const username = guestUsernameInput.value.trim();

    if (!username) {
        if (guestError) {
            guestError.textContent = 'Please enter a username';
            guestError.classList.remove('hidden');
        }
        return;
    }

    // Save guest username
    localStorage.setItem('ghost_offline_user', username);
    localUserName = username;

    // Set guest mode
    isGuestMode = true;
    localStorage.setItem('isGuestMode', 'true');

    // Clear any existing user data
    currentUser = null;
    localStorage.removeItem('ghost_user');

    // Hide modal and go to dashboard
    hideGuestModal();

    if (btnLogout) btnLogout.classList.add('hidden');
    handleGridClass(false);

    if (saveStatus) saveStatus.innerText = `Guest: ${username}`;
    if (pageLoader) pageLoader.dataset.init = "true";
    switchView('dashboard');
}

// TEMPLATE MODAL FUNCTIONS
function renderTemplates(category = 'all') {
    if (!templateGrid) return;

    templateGrid.innerHTML = '';

    const filteredTemplates = category === 'all'
        ? templates
        : templates.filter(t => t.category === category);

    if (filteredTemplates.length === 0) {
        templateGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted)">
                <i class="fa-solid fa-layer-group" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                <h3>No templates in this category</h3>
                <p>Try selecting a different category</p>
            </div>
        `;
        return;
    }

    filteredTemplates.forEach(template => {
        const templateCard = document.createElement('div');
        templateCard.className = 'template-card';
        templateCard.dataset.templateId = template.id;

        templateCard.innerHTML = `
            <div class="template-icon">
                <i class="${template.icon}"></i>
            </div>
            <h3 class="template-title">${template.title}</h3>
            <p class="template-description">${template.description}</p>
            <div class="template-preview">${template.preview}</div>
        `;

        templateCard.addEventListener('click', () => {
            applyTemplate(template);
        });

        templateGrid.appendChild(templateCard);
    });
}

function applyTemplate(template) {
    if (!writerArea || !titleInput) return;

    templateModal.classList.add('hidden');
    currentNoteId = Date.now();
    titleInput.value = template.title;
    writerArea.innerHTML = template.content;
    updateWordCount(writerArea.innerText);

    const activeNote = {
        id: currentNoteId,
        title: template.title,
        content: template.content,
        date: new Date().toLocaleDateString('en-US', options),
        timestamp: Date.now(),
        author: currentUser ? (currentUser.email) : (localUserName || 'Anonymous'),
        deleted: false,
        synced: false
    };

    notes.unshift(activeNote);
    localStorage.setItem('ghostNotes', JSON.stringify(notes));
    saveViewState('writer', currentNoteId);

    if (saveStatus) saveStatus.innerText = "Template loaded";
    setTimeout(() => {
        if (writerArea) writerArea.focus();
    }, 100);

    if (currentUser && supabaseClient) {
        saveNoteToCloud(activeNote);
    }
}

function initTemplateModal() {
    renderTemplates('all');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            currentTemplateCategory = category;
            renderTemplates(category);
        });
    });
}

function openTemplateModal() {
    if (window.innerWidth <= 768) {
        alert("Templates are only available on desktop devices.");
        return;
    }
    templateModal.classList.remove('hidden');
    renderTemplates(currentTemplateCategory);
}

function closeTemplateModal() {
    templateModal.classList.add('hidden');
}

// MODAL MANAGEMENT FUNCTIONS
function showCustomModal(title, msg, onConfirm) {
    if (!modalOverlay) return;
    modalTitle.innerText = title;
    modalMsg.innerText = msg;
    modalCallback = onConfirm;
    modalOverlay.classList.remove('hidden');
}

function hideCustomModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('hidden');
    modalCallback = null;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
}

// PDF GENERATION
function generatePDF(filename, theme) {
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-container';
    tempContainer.style.padding = '40px';
    tempContainer.style.fontFamily = 'Nunito, sans-serif';
    tempContainer.style.color = '#000000';

    if (theme === 'dark') {
        tempContainer.style.backgroundColor = '#1a1a1a';
        tempContainer.style.color = '#e0e0e0';
    }

    const selectedNotes = notes.filter(n => selectedNoteIds.has(n.id));

    if (selectedNotes.length === 0) {
        alert("No notes selected for export.");
        return;
    }

    selectedNotes.forEach(note => {
        const noteDiv = document.createElement('div');
        noteDiv.style.marginBottom = '30px';
        noteDiv.style.borderBottom = '1px solid #ccc';
        noteDiv.style.paddingBottom = '20px';

        const title = document.createElement('h2');
        title.innerText = note.title || 'Untitled';
        title.style.marginBottom = '10px';

        const date = document.createElement('p');
        date.innerText = note.date;
        date.style.fontSize = '0.8rem';
        date.style.color = '#888';
        date.style.marginBottom = '15px';

        const body = document.createElement('div');
        body.innerHTML = note.content;
        body.style.lineHeight = '1.6';

        noteDiv.appendChild(title);
        noteDiv.appendChild(date);
        noteDiv.appendChild(body);
        tempContainer.appendChild(noteDiv);
    });

    const opt = {
        margin: 10,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempContainer).save();
}

// MOBILE PREVIEW FUNCTIONS
function openMobilePreview(note) {
    activePreviewNoteId = note.id;
    if (sheetTitle) sheetTitle.innerText = note.title || "Untitled";
    if (sheetDate) sheetDate.innerText = note.date;
    if (sheetBody) sheetBody.innerHTML = note.content || "(No content)";
    if (previewOverlay) previewOverlay.classList.remove('hidden');
    setTimeout(() => {
        if (previewSheet) {
            previewSheet.classList.add('active');
            previewSheet.style.transform = 'translateY(0)';
        }
    }, 10);
}

function closeMobilePreview() {
    if (previewSheet) {
        previewSheet.classList.remove('active');
        previewSheet.style.transform = 'translateY(100%)';
    }
    setTimeout(() => {
        if (previewOverlay) previewOverlay.classList.add('hidden');
    }, 300);
}

// TOOLBAR FUNCTIONS
function initEditorPasteHandler() {
    if (writerArea) {
        writerArea.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            document.execCommand('insertText', false, text);
        });
    }
}

function applyColor(color) {
    if (!writerArea) return;
    writerArea.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, color);
    saveCurrentNote();

    colorBtns.forEach(btn => {
        if (btn.getAttribute('data-color') === color) {
            btn.classList.add('active-tool');
        } else {
            btn.classList.remove('active-tool');
        }
    });
}

function applyFormat(cmd) {
    if (!writerArea) return;
    writerArea.focus();

    if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
        const isAlreadyActive = document.queryCommandState(cmd);
        if (isAlreadyActive) {
            document.execCommand(cmd, false, null);
            if (cmd === 'insertUnorderedList') {
                bulletListActive = false;
            } else {
                numberListActive = false;
            }
        } else {
            if (cmd === 'insertUnorderedList' && document.queryCommandState('insertOrderedList')) {
                document.execCommand('insertOrderedList', false, null);
                numberListActive = false;
            } else if (cmd === 'insertOrderedList' && document.queryCommandState('insertUnorderedList')) {
                document.execCommand('insertUnorderedList', false, null);
                bulletListActive = false;
            }
            document.execCommand(cmd, false, null);
            if (cmd === 'insertUnorderedList') {
                bulletListActive = true;
            } else {
                numberListActive = true;
            }
        }
    } else {
        document.execCommand(cmd, false, null);
    }

    saveCurrentNote();
    formatBtns.forEach(btn => {
        if (btn.getAttribute('data-cmd') === cmd) {
            const isActive = document.queryCommandState(cmd);
            btn.classList.toggle('active-tool', isActive);
            if (cmd === 'insertUnorderedList') {
                formatBtns.forEach(otherBtn => {
                    if (otherBtn.getAttribute('data-cmd') === 'insertOrderedList') {
                        otherBtn.classList.toggle('active-tool', false);
                    }
                });
            } else if (cmd === 'insertOrderedList') {
                formatBtns.forEach(otherBtn => {
                    if (otherBtn.getAttribute('data-cmd') === 'insertUnorderedList') {
                        otherBtn.classList.toggle('active-tool', false);
                    }
                });
            }
        }
    });
}

function insertText(text) {
    if (!writerArea) return;
    writerArea.focus();
    document.execCommand('insertText', false, text);
    saveCurrentNote();
}

function updateFormatButtonStates() {
    if (!writerArea) return;
    formatBtns.forEach(btn => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd) {
            const isActive = document.queryCommandState(cmd);
            btn.classList.toggle('active-tool', isActive);
            if (cmd === 'insertUnorderedList') {
                bulletListActive = isActive;
            } else if (cmd === 'insertOrderedList') {
                numberListActive = isActive;
            }
        }
    });
}

function initToolbar() {
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const color = btn.getAttribute('data-color');
            if (color) applyColor(color);
        });
    });
    formatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.getAttribute('data-cmd');
            if (cmd) applyFormat(cmd);
        });
    });
    textPills.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const text = btn.getAttribute('data-text');
            if (text) insertText(text);
        });
    });
    document.addEventListener('selectionchange', updateFormatButtonStates);
    if (writerArea) {
        writerArea.addEventListener('mouseup', updateFormatButtonStates);
        writerArea.addEventListener('keyup', updateFormatButtonStates);
    }
}

// AUTH AND SYNC FUNCTIONS
function handleGridClass(isLoggedIn) {
    if (dashBtnContainer) {
        if (isLoggedIn) {
            dashBtnContainer.classList.add('with-logout');
        } else {
            dashBtnContainer.classList.remove('with-logout');
        }
    }
}

async function checkSession() {
    if (!supabaseClient) {
        console.log("Supabase client not available, running in offline mode");
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            if (btnLogout) btnLogout.classList.remove('hidden');
            handleGridClass(true);
            await fetchNotesFromCloud();
        } else {
            currentUser = null;
            if (btnLogout) btnLogout.classList.add('hidden');
            handleGridClass(false);
        }
    } catch (err) {
        console.error("Session check failed", err);
        currentUser = null;
        if (btnLogout) btnLogout.classList.add('hidden');
        handleGridClass(false);
    }
}

async function syncOfflineNotesToCloud(userName) {
    if (!currentUser || !userName || notes.length === 0 || !supabaseClient) return;
    if (saveStatus) saveStatus.innerText = "Syncing offline notes to cloud...";
    try {
        const updatedNotes = notes.map(note => ({
            ...note,
            author: userName,
            synced: false
        }));
        for (const note of updatedNotes) {
            await saveNoteToCloud(note);
        }
        notes = updatedNotes;
        localStorage.setItem('ghostNotes', JSON.stringify(notes));
        if (saveStatus) saveStatus.innerText = "Offline notes synced to cloud!";
        setTimeout(() => {
            if (saveStatus) saveStatus.innerText = "Ready";
        }, 3000);
    } catch (error) {
        console.error("Error syncing notes:", error);
        if (saveStatus) saveStatus.innerText = "Sync failed";
    }
}

async function handleLogout() {
    if (!supabaseClient) {
        currentUser = null;
        isGuestMode = false;
        notes = [];
        localStorage.removeItem('ghostNotes');
        localStorage.removeItem('ghostLastView');
        localStorage.removeItem('ghost_offline_user');
        localStorage.removeItem('isGuestMode');
        localStorage.removeItem('ghost_user');
        window.location.reload();
        return;
    }

    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        currentUser = null;
        isGuestMode = false;
        notes = [];
        localStorage.removeItem('ghostNotes');
        localStorage.removeItem('ghostLastView');
        localStorage.removeItem('ghost_offline_user');
        localStorage.removeItem('isGuestMode');
        localStorage.removeItem('ghost_user');
        window.location.reload();
    }
}

// ────────────────────────────────────────────────────────
// SUPABASE DATABASE SYNC INTEGRATION
// ────────────────────────────────────────────────────────

async function fetchNotesFromCloud() {
    if (!currentUser || !supabaseClient) {
        console.log("Not fetching from cloud: No user or supabase client");
        return;
    }
    if (saveStatus) saveStatus.innerText = "Syncing from Cloud...";
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('timestamp', { ascending: false });
        if (error) {
            console.error("Error fetching notes:", error);
            if (saveStatus) saveStatus.innerText = "Offline Mode";
            return;
        }
        if (data && data.length > 0) {
            const cloudNotes = data.map(n => ({
                id: parseInt(n.local_id) || Date.now(),
                title: n.title,
                content: n.content,
                date: n.date,
                timestamp: parseInt(n.timestamp) || Date.now(),
                author: n.author || (currentUser.email) || 'Anonymous',
                deleted: n.deleted || false,
                synced: true
            }));

            // Merge with local changes that aren't synced yet
            const localNotes = notes.filter(n => !n.synced);
            const allNotes = [...cloudNotes, ...localNotes];
            const noteMap = new Map();

            allNotes.forEach(note => {
                if (!noteMap.has(note.id) || note.timestamp > noteMap.get(note.id).timestamp) {
                    noteMap.set(note.id, note);
                }
            });

            notes = Array.from(noteMap.values()).sort((a, b) => b.timestamp - a.timestamp);
            localStorage.setItem('ghostNotes', JSON.stringify(notes));

            // Trigger UI refreshes
            const currentView = document.querySelector('.view-section:not(.hidden)');
            if (currentView) {
                if (currentView.id === 'view-dashboard') renderDashboard();
                if (currentView.id === 'view-history') renderHistoryGrid();
                if (currentView.id === 'view-bin') renderBinGrid();
            }

            if (saveStatus) saveStatus.innerText = "Synced with Cloud";
            setTimeout(() => {
                if (saveStatus) saveStatus.innerText = "Ready";
            }, 2000);
        }
    } catch (err) {
        console.error("Fetch notes error:", err);
        if (saveStatus) saveStatus.innerText = "Sync failed";
    }
}

async function saveNoteToCloud(note) {
    if (!currentUser || !supabaseClient) {
        const name = localStorage.getItem('ghost_offline_user') || 'Offline';
        if (saveStatus) saveStatus.innerText = `Saved Locally (${name})`;
        note.synced = false;
        return;
    }
    if (saveStatus) saveStatus.innerText = "Uploading to Cloud...";
    try {
        const { error } = await supabaseClient
            .from('notes')
            .upsert({
                user_id: currentUser.id,
                local_id: note.id.toString(),
                title: note.title,
                content: note.content,
                date: note.date,
                timestamp: note.timestamp,
                author: note.author || (currentUser.email) || 'Anonymous',
                deleted: note.deleted || false
            }, {
                onConflict: 'user_id, local_id'
            });
        if (error) {
            console.error("Save to cloud error:", error);
            if (saveStatus) saveStatus.innerText = "Save Failed (Local Only)";
            note.synced = false;
        } else {
            if (saveStatus) saveStatus.innerText = "Saved to Cloud";
            note.synced = true;
        }
    } catch (err) {
        console.error("Save note error:", err);
        if (saveStatus) saveStatus.innerText = "Network Error";
        note.synced = false;
    }
}

async function deleteNotesFromCloud(idsToDelete) {
    if (!currentUser || !supabaseClient) return;
    const ids = Array.from(idsToDelete).map(id => id.toString());
    try {
        const { error } = await supabaseClient
            .from('notes')
            .delete()
            .in('local_id', ids)
            .eq('user_id', currentUser.id);
        if (error) {
            console.error("Delete from cloud error:", error);
        }
    } catch (err) {
        console.error("Delete notes error:", err);
    }
}

// NOTE MANAGEMENT FUNCTIONS
function saveCurrentNote() {
    if (!writerArea || !titleInput) return;
    const content = writerArea.innerHTML;
    const title = titleInput.value;
    const plainText = writerArea.innerText.trim();
    const hasTitle = title.trim().length > 0;
    const hasContent = plainText.length > 0;
    if (!hasTitle && !hasContent) {
        if (currentNoteId) {
            const noteIndex = notes.findIndex(n => n.id === currentNoteId);
            if (noteIndex > -1) {
                notes.splice(noteIndex, 1);
                localStorage.setItem('ghostNotes', JSON.stringify(notes));
                if (currentUser && supabaseClient) {
                    deleteNotesFromCloud([currentNoteId]);
                }
            }
        }
        if (saveStatus) saveStatus.innerText = "Empty (Not Saved)";
        updateWordCount("");
        return;
    }
    let activeNote = null;
    if (!currentNoteId) {
        currentNoteId = Date.now();
        activeNote = {
            id: currentNoteId,
            title: title,
            content: content,
            date: new Date().toLocaleDateString('en-US', options),
            timestamp: Date.now(),
            author: currentUser ? (currentUser.email) : (localUserName || 'Anonymous'),
            deleted: false,
            synced: false
        };
        notes.unshift(activeNote);
        saveViewState('writer', currentNoteId);
    } else {
        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex > -1) {
            notes[noteIndex].content = content;
            notes[noteIndex].title = title;
            notes[noteIndex].timestamp = Date.now();
            notes[noteIndex].synced = false;
            activeNote = notes[noteIndex];
            notes.splice(noteIndex, 1);
            notes.unshift(activeNote);
        } else {
            activeNote = {
                id: currentNoteId,
                title: title,
                content: content,
                date: new Date().toLocaleDateString('en-US', options),
                timestamp: Date.now(),
                author: currentUser ? (currentUser.email) : (localUserName || 'Anonymous'),
                deleted: false,
                synced: false
            };
            notes.unshift(activeNote);
        }
    }
    localStorage.setItem('ghostNotes', JSON.stringify(notes));
    if (saveStatus) saveStatus.innerText = "Saving...";
    updateWordCount(writerArea.innerText);
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        if (activeNote) {
            if (currentUser && supabaseClient && navigator.onLine) {
                saveNoteToCloud(activeNote);
            } else {
                const name = localUserName || 'Local';
                if (saveStatus) saveStatus.innerText = `Saved Locally (${name})`;
            }
        }
    }, 1000);
}

function updateWordCount(text) {
    if (wordCountBadge) {
        const count = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        wordCountBadge.innerText = `${count} words`;
    }
}

function loadNoteIntoEditor(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        currentNoteId = note.id;
        if (writerArea) writerArea.innerHTML = note.content;
        if (titleInput) titleInput.value = note.title;
        updateWordCount(writerArea.innerText);
        if (saveStatus) saveStatus.innerText = "Loaded";
        saveViewState('writer', noteId);
    } else {
        currentNoteId = null;
        if (writerArea) writerArea.innerHTML = "";
        if (titleInput) titleInput.value = "";
        updateWordCount("");
        if (saveStatus) saveStatus.innerText = "New Note";
        saveViewState('writer', null);
    }
}

function saveViewState(viewName, noteId = null) {
    localStorage.setItem('ghostLastView', viewName);
    if (noteId) localStorage.setItem('ghostLastNote', noteId.toString());
    else localStorage.removeItem('ghostLastNote');
}

// VIEW NAVIGATION
function switchView(target) {
    if (pageLoader && pageLoader.dataset.init === "true") {
        pageLoader.classList.add('animate');
    }
    if (target !== 'initial') saveViewState(target, currentNoteId);
    setTimeout(() => {
        [viewIntro, viewDashboard, viewHome, viewHistory, viewBin].forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (target === 'dashboard') {
            if (viewDashboard) viewDashboard.classList.remove('hidden');
            renderDashboard();
        }
        else if (target === 'writer') {
            if (viewHome) viewHome.classList.remove('hidden');
            setTimeout(() => {
                if (writerArea) writerArea.focus();
            }, 100);
        }
        else if (target === 'intro') {
            if (viewIntro) viewIntro.classList.remove('hidden');
        }
        else if (target === 'history') {
            if (viewHistory) viewHistory.classList.remove('hidden');
            renderHistoryGrid();
        }
        else if (target === 'bin') {
            if (viewBin) viewBin.classList.remove('hidden');
            renderBinGrid();
        }
        if (pageLoader && pageLoader.dataset.init === "true") {
            setTimeout(() => {
                if (pageLoader) pageLoader.classList.remove('animate');
            }, 300);
        }
    }, (pageLoader && pageLoader.dataset.init === "true") ? 600 : 0);
}

// RENDERING FUNCTIONS
function handleNoteAction(note) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        openMobilePreview(note);
    } else {
        if (pageLoader) pageLoader.dataset.init = "true";
        loadNoteIntoEditor(note.id);
        switchView('writer');
    }
}

function renderDashboard() {
    if (!dashboardCards) return;
    dashboardCards.innerHTML = '';
    const activeNotes = notes.filter(n => !n.deleted);
    const recentNotes = activeNotes.slice(0, 2);
    recentNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'dash-card';
        const t = note.title || "Untitled";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = note.content || "";
        const c = (tempDiv.innerText || "").substring(0, 100);
        card.innerHTML = `
            <div>
                <h3 class="recent-title">${t}</h3>
                <p class="recent-preview">${c}</p>
            </div>
            <div class="recent-date">${note.date}</div>
            ${note.synced ? '<span class="cloud-badge" style="position:absolute; top:10px; right:10px; font-size:0.7rem; color:var(--accent-color);"><i class="fa-solid fa-cloud"></i></span>' : ''}
        `;
        card.addEventListener('click', () => handleNoteAction(note));
        dashboardCards.appendChild(card);
    });
    if (window.innerWidth > 768) {
        const newCard = document.createElement('div');
        newCard.className = 'dash-card dash-card-new';
        newCard.innerHTML = `<i class="fa-solid fa-plus"></i><span>New Note</span>`;
        newCard.addEventListener('click', () => {
            if (pageLoader) pageLoader.dataset.init = "true";
            loadNoteIntoEditor(null);
            switchView('writer');
        });
        dashboardCards.appendChild(newCard);
    }
}

function renderHistoryGrid() {
    if (!notesGrid) return;
    notesGrid.innerHTML = '';
    selectedNoteIds.clear();
    toggleSelectionMode(false);
    const activeNotes = notes.filter(n => !n.deleted);
    if (activeNotes.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }
    if (emptyMsg) emptyMsg.classList.add('hidden');
    activeNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        const t = note.title || "Untitled";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = note.content || "";
        const c = (tempDiv.innerText || "").substring(0, 150);
        card.innerHTML = `
            <div class="card-checkbox"></div>
            <h3 class="card-title">${t}</h3>
            <p class="card-preview">${c}</p>
            <div class="card-date">${note.date}</div>
            ${note.synced ? '<span class="cloud-badge" style="position:absolute; bottom:10px; left:10px; font-size:0.7rem; color:var(--accent-color);"><i class="fa-solid fa-cloud"></i></span>' : ''}
        `;
        card.addEventListener('click', () => {
            if (isSelectionMode) {
                if (selectedNoteIds.has(note.id)) {
                    selectedNoteIds.delete(note.id);
                    card.classList.remove('selected');
                } else {
                    selectedNoteIds.add(note.id);
                    card.classList.add('selected');
                }
                updateDeleteButton();
            } else {
                handleNoteAction(note);
            }
        });
        notesGrid.appendChild(card);
    });
}

function renderBinGrid() {
    if (!binGrid) return;
    binGrid.innerHTML = '';
    const deletedNotes = notes.filter(n => n.deleted);
    if (deletedNotes.length === 0) {
        if (emptyBinMsg) emptyBinMsg.classList.remove('hidden');
        return;
    }
    if (emptyBinMsg) emptyBinMsg.classList.add('hidden');
    deletedNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        const t = note.title || "Untitled";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = note.content || "";
        const c = (tempDiv.innerText || "").substring(0, 100);
        card.innerHTML = `
            <h3 class="card-title" style="text-decoration: line-through; opacity: 0.8;">${t}</h3>
            <p class="card-preview" style="opacity: 0.8;">${c}</p>
            <div class="card-date" style="opacity: 0.7;">${note.date}</div>
        `;
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'bin-actions';
        actionsDiv.innerHTML = `
            <button class="bin-btn bin-btn-restore" title="Restore">
                <i class="fa-solid fa-rotate-left"></i> Restore
            </button>
            <button class="bin-btn bin-btn-delete" title="Delete Forever">
                <i class="fa-solid fa-trash"></i> Delete
            </button>
        `;
        card.appendChild(actionsDiv);
        const restoreBtn = card.querySelector('.bin-btn-restore');
        restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            note.deleted = false;
            localStorage.setItem('ghostNotes', JSON.stringify(notes));
            saveNoteToCloud(note);
            renderBinGrid();
        });
        const deleteBtn = card.querySelector('.bin-btn-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showCustomModal("Delete Forever?", "This note will be lost permanently.", () => {
                notes = notes.filter(n => n.id !== note.id);
                localStorage.setItem('ghostNotes', JSON.stringify(notes));
                if (currentUser && supabaseClient) {
                    deleteNotesFromCloud([note.id]);
                }
                renderBinGrid();
            });
        });
        binGrid.appendChild(card);
    });
}

// SELECTION MODE FUNCTIONS
function toggleSelectionMode(forceState) {
    if (!btnSelectMode) return;
    isSelectionMode = forceState !== undefined ? forceState : !isSelectionMode;
    const selectBtnText = btnSelectMode.querySelector('.btn-label-text');
    const bulkWrapper = document.getElementById('bulk-actions-wrapper');
    if (isSelectionMode) {
        if (notesGrid) notesGrid.classList.add('selection-mode');
        if (selectBtnText) selectBtnText.innerText = "Cancel";
        if (bulkWrapper) bulkWrapper.classList.remove('hidden');
    } else {
        if (notesGrid) notesGrid.classList.remove('selection-mode');
        if (selectBtnText) selectBtnText.innerText = "Select";
        if (bulkWrapper) bulkWrapper.classList.add('hidden');
        document.querySelectorAll('.note-card.selected').forEach(el => el.classList.remove('selected'));
        selectedNoteIds.clear();
    }
    updateDeleteButton();
}

function updateDeleteButton() {
    if (!btnDeleteSelected) return;
    const count = selectedNoteIds.size;
    if (selectedCountSpan) selectedCountSpan.innerText = count;
    const isDisabled = count === 0;
    btnDeleteSelected.disabled = isDisabled;
    btnDeleteSelected.style.opacity = isDisabled ? "0.5" : "1";
    if (btnExportSelected) {
        btnExportSelected.disabled = isDisabled;
        btnExportSelected.style.opacity = isDisabled ? "0.5" : "1";
    }
}

function deleteSelectedNotes() {
    if (selectedNoteIds.size === 0) return;
    notes.forEach(note => {
        if (selectedNoteIds.has(note.id)) {
            note.deleted = true;
            saveNoteToCloud(note);
        }
    });
    localStorage.setItem('ghostNotes', JSON.stringify(notes));
    if (selectedNoteIds.has(currentNoteId)) {
        currentNoteId = null;
        if (writerArea) writerArea.innerHTML = "";
        if (titleInput) titleInput.value = "";
        saveViewState('writer', null);
    }
    renderHistoryGrid();
}

// INITIALIZATION
function initEventListeners() {
    // Modal event listeners
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', hideCustomModal);
    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', () => {
        if (modalCallback) modalCallback();
        hideCustomModal();
    });

    // Export modal
    if (btnExportSelected) {
        btnExportSelected.addEventListener('click', () => {
            if (selectedNoteIds.size === 0) {
                alert("Please select notes to export first.");
                return;
            }
            if (exportModal) exportModal.classList.remove('hidden');
            if (exportFilenameInput) {
                exportFilenameInput.value = `GhostNotes_${new Date().toISOString().slice(0, 10)}`;
            }
        });
    }
    if (btnCancelExport) {
        btnCancelExport.addEventListener('click', () => {
            if (exportModal) exportModal.classList.add('hidden');
        });
    }
    if (themeOptions) {
        themeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                themeOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                selectedExportTheme = opt.getAttribute('data-theme');
            });
        });
    }
    if (btnConfirmExport) {
        btnConfirmExport.addEventListener('click', () => {
            const filename = exportFilenameInput ? exportFilenameInput.value || 'GhostNotes' : 'GhostNotes';
            generatePDF(filename, selectedExportTheme);
            if (exportModal) exportModal.classList.add('hidden');
            toggleSelectionMode(false);
        });
    }

    // Preview sheet
    if (sheetCloseBtn) sheetCloseBtn.addEventListener('click', closeMobilePreview);
    if (previewOverlay) previewOverlay.addEventListener('click', closeMobilePreview);
    if (sheetEditBtn) sheetEditBtn.addEventListener('click', () => {
        if (activePreviewNoteId) {
            closeMobilePreview();
            setTimeout(() => {
                loadNoteIntoEditor(activePreviewNoteId);
                switchView('writer');
            }, 300);
        }
    });

    // Template modal
    if (btnOpenTemplates) {
        btnOpenTemplates.addEventListener('click', openTemplateModal);
    }
    if (btnCloseTemplate) {
        btnCloseTemplate.addEventListener('click', closeTemplateModal);
    }

    // Auth modal navigation
    authNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchAuthMode(btn.dataset.mode);
        });
    });

    // Auth proceed button
    if (authProceedBtn) {
        authProceedBtn.addEventListener('click', () => {
            if (authMode === 'login') {
                handleLogin();
            } else {
                handleSignup();
            }
        });
    }

    // Auth cancel button
    if (authCancelBtn) {
        authCancelBtn.addEventListener('click', hideAuthModal);
    }

    // Guest modal
    if (guestProceedBtn) {
        guestProceedBtn.addEventListener('click', handleGuestLogin);
    }
    if (guestCancelBtn) {
        guestCancelBtn.addEventListener('click', hideGuestModal);
    }

    // Guest button in intro
    if (guestBtnIntro) {
        guestBtnIntro.addEventListener('click', showGuestModal);
    }

    // View navigation
    if (btnLetsGo) btnLetsGo.addEventListener('click', () => {
        // Check if user is already logged in or in guest mode
        const savedUser = localStorage.getItem('ghost_user');
        if (savedUser || isGuestMode) {
            if (pageLoader) pageLoader.dataset.init = "true";
            switchView('dashboard');
        } else {
            showAuthModal();
        }
    });

    if (btnDashBack) btnDashBack.addEventListener('click', () => {
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('intro');
    });
    if (btnExit) btnExit.addEventListener('click', () => {
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('dashboard');
    });
    if (btnDashboardHistory) btnDashboardHistory.addEventListener('click', () => {
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('history');
    });
    if (btnBackFromHistory) btnBackFromHistory.addEventListener('click', () => {
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('dashboard');
    });
    if (btnDashboardBin) btnDashboardBin.addEventListener('click', () => {
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('bin');
    });
    if (btnBackFromBin) btnBackFromBin.addEventListener('click', () => {
        if (pageLoader) pageLoader.dataset.init = "true";
        switchView('dashboard');
    });

    // Mobile navigation
    if (btnNewNoteMob) {
        btnNewNoteMob.addEventListener('click', () => {
            if (pageLoader) pageLoader.dataset.init = "true";
            loadNoteIntoEditor(null);
            switchView('writer');
        });
    }
    if (btnOpenBinMob) {
        btnOpenBinMob.addEventListener('click', () => {
            if (pageLoader) pageLoader.dataset.init = "true";
            switchView('bin');
        });
    }

    // Empty bin
    if (btnEmptyBin) {
        btnEmptyBin.addEventListener('click', () => {
            const deletedCount = notes.filter(n => n.deleted).length;
            if (deletedCount === 0) {
                alert("Recycle bin is already empty.");
                return;
            }
            showCustomModal("Empty Recycle Bin?", `Permanently delete ${deletedCount} items?`, () => {
                const idsToDelete = notes.filter(n => n.deleted).map(n => n.id);
                notes = notes.filter(n => !n.deleted);
                localStorage.setItem('ghostNotes', JSON.stringify(notes));
                if (currentUser && supabaseClient) {
                    deleteNotesFromCloud(idsToDelete);
                }
                renderBinGrid();
            });
        });
    }

    // Selection mode
    if (btnSelectMode) btnSelectMode.addEventListener('click', () => toggleSelectionMode());
    if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', deleteSelectedNotes);

    // Logout
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // Auto-save
    if (writerArea) {
        writerArea.addEventListener('input', saveCurrentNote);
        writerArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                setTimeout(saveCurrentNote, 0);
            }
        });
    }
    if (titleInput) titleInput.addEventListener('input', saveCurrentNote);

    // Window resize
    window.addEventListener('resize', () => {
        if (toolbarBelt) {
            if (window.innerWidth <= 768) {
                toolbarBelt.classList.remove('hidden-belt');
                toolbarBelt.style.display = 'flex';
            }
        }
        const currentView = document.querySelector('.view-section:not(.hidden)');
        if (currentView && currentView.id === 'view-dashboard') {
            renderDashboard();
        } else if (currentView && currentView.id === 'view-history') {
            renderHistoryGrid();
        } else if (currentView && currentView.id === 'view-bin') {
            renderBinGrid();
        }
    });

    // Online/offline status
    window.addEventListener('online', async () => {
        if (!currentUser) return;
        if (saveStatus) saveStatus.innerText = "Back Online. Syncing...";
        const unsyncedNotes = notes.filter(note => !note.synced && currentUser);
        if (unsyncedNotes.length > 0 && supabaseClient) {
            for (const note of unsyncedNotes) {
                await saveNoteToCloud(note);
                note.synced = true;
            }
            localStorage.setItem('ghostNotes', JSON.stringify(notes));
        }
        await fetchNotesFromCloud();
    });
    window.addEventListener('offline', () => {
        if (saveStatus) saveStatus.innerText = "Offline Mode";
    });

    // Click outside modal to close
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });

    // Enter key in auth inputs
    [loginUsernameInput, loginEmailInput, loginPasswordInput,
        signupEmailInput, signupPasswordInput, signupConfirmPasswordInput,
        guestUsernameInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (authModal && !authModal.classList.contains('hidden')) {
                            if (authMode === 'login') {
                                handleLogin();
                            } else {
                                handleSignup();
                            }
                        } else if (guestModal && !guestModal.classList.contains('hidden')) {
                            handleGuestLogin();
                        }
                    }
                });
            }
        });
}

async function initApp() {
    console.log("Initializing Ghost Writer App...");
    loadTheme();
    initThemeToggle();
    initTemplateModal();
    initToolbar();
    initEditorPasteHandler();
    initEventListeners();
    await checkSession();

    // Check if user is already logged in or in guest mode
    const savedUser = localStorage.getItem('ghost_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isGuestMode = false;
        } catch (e) {
            currentUser = null;
        }
    }

    if (pageLoader) {
        pageLoader.dataset.init = "true";
    }

    const lastView = localStorage.getItem('ghostLastView');
    const lastNoteId = localStorage.getItem('ghostLastNote');
    let initialView = 'intro';

    if (lastView && lastView !== 'intro') {
        if (currentUser || isGuestMode) {
            initialView = lastView;
            if (lastView === 'writer' && lastNoteId) {
                loadNoteIntoEditor(parseInt(lastNoteId));
            }
        }
    }

    switchView(initialView);

    if (window.innerWidth <= 768 && toolbarBelt) {
        toolbarBelt.classList.remove('hidden-belt');
        toolbarBelt.style.display = 'flex';
    }

    console.log("App initialization complete");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
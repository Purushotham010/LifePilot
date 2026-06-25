import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY || process.env.harika_key;
const ai = apiKey 
  ? new GoogleGenAI({ apiKey }) 
  : null;

// Helper to seed realistic, premium, high-fidelity mock data for the user
async function seedUserData(userId: string, force: boolean = false) {
  try {
    if (force) {
      // Delete existing records to allow a clean reset
      await prisma.aIPlan.deleteMany({ where: { task: { userId } } });
      await prisma.task.deleteMany({ where: { userId } });
      await prisma.habit.deleteMany({ where: { userId } });
      await prisma.analytics.deleteMany({ where: { userId } });
    } else {
      // Prevent duplicate seeding
      const existingCount = await prisma.task.count({ where: { userId } });
      if (existingCount > 0) return;
    }

    // 1. Task 1: Google AI Hackathon Pitch & Video Submission (High Risk, with Active Rescue Plan)
    const task1 = await prisma.task.create({
      data: {
        userId,
        title: "Google AI Hackathon Pitch & Video Submission",
        description: "Record and compile the final 3-minute presentation demonstrating the productivity companion's agentic risk engine, rescue plans, and proactive intervention layout.",
        priority: "Critical",
        difficulty: "High",
        estimatedTime: 180,
        status: "Pending",
        deadline: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
        riskLevel: "High",
        riskReason: "Deadline is in 3.5 hours. Compiling high-fidelity video demonstrations and syncing voiceovers typically requires 4.5 hours. You are currently 1 hour short of the safe buffer.",
        rescuePlan: JSON.stringify([
          { timeframe: "Next 15m", action: "Outline 3 killer feature highlights to showcase (avoid empty larping or over-complex slides)." },
          { timeframe: "Next 45m", action: "Record a single-take raw desktop demonstration showing live user interventions." },
          { timeframe: "Next 30m", action: "Record clean voiceover audio and synchronize timeline without heavy transitions." },
          { timeframe: "Before Deadline", action: "Directly publish and host on a fast delivery source (YouTube/Drive) to bypass rendering delays." }
        ])
      }
    });

    // Create steps for Task 1
    const steps1 = [
      { step: "Draft core script and highlight pointers", completionStatus: true },
      { step: "Configure pristine dev databases and layout state", completionStatus: true },
      { step: "Screen-record the active Rescue Mode interactive loop", completionStatus: false },
      { step: "Render & submit final form before submission deadline", completionStatus: false }
    ];
    for (const s of steps1) {
      await prisma.aIPlan.create({
        data: {
          taskId: task1.id,
          step: s.step,
          completionStatus: s.completionStatus
        }
      });
    }

    // 2. Task 2: Polish Responsive Dashboard Bento Grid (High Priority, Pending, Medium Risk)
    const task2 = await prisma.task.create({
      data: {
        userId,
        title: "Polish Responsive Dashboard Bento Grid",
        description: "Review CSS boundaries, padding rhythms, and touch target area sizes on mobile devices to ensure a highly tactile, professional product experience.",
        priority: "High",
        difficulty: "Medium",
        estimatedTime: 90,
        status: "Pending",
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        riskLevel: "Medium",
        riskReason: "Aesthetic details might expand beyond initial time window, but current progress is comfortable."
      }
    });

    const steps2 = [
      { step: "Ensure all touch-targets are >= 44px on smaller screens", completionStatus: false },
      { step: "Check typography pairings and letter-spacing tracking under high contrast", completionStatus: false }
    ];
    for (const s of steps2) {
      await prisma.aIPlan.create({
        data: {
          taskId: task2.id,
          step: s.step,
          completionStatus: s.completionStatus
        }
      });
    }

    // 3. Task 3: Core Database Migration and Schema Polish (Medium Priority, Completed)
    await prisma.task.create({
      data: {
        userId,
        title: "Core Database Migration & Schema Polish",
        description: "Set up local SQLite architecture, map structural relations, and create robust cascades for user-authored items.",
        priority: "Medium",
        difficulty: "High",
        estimatedTime: 120,
        status: "Completed",
        progress: 100,
        deadline: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours ago
        riskLevel: "Low"
      }
    });

    // 4. Task 4: Integrate SDK Error Backoff Retries (Medium Priority, Completed)
    await prisma.task.create({
      data: {
        userId,
        title: "Integrate Gemini SDK Error Backoff Retries",
        description: "Add robust handlers for transient network disruptions and automated fallback strategies for API quotas.",
        priority: "Medium",
        difficulty: "Low",
        estimatedTime: 45,
        status: "Completed",
        progress: 100,
        deadline: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        riskLevel: "Low"
      }
    });

    // 5. Seed some Habits to make the database robust
    const habits = [
      { habitName: "60-Min Focused Deep Work Sprints", streak: 5 },
      { habitName: "Resolve high-priority schedule conflicts first", streak: 3 },
      { habitName: "Complete daily planning routine", streak: 8 }
    ];
    for (const h of habits) {
      await prisma.habit.create({
        data: {
          userId,
          habitName: h.habitName,
          streak: h.streak
        }
      });
    }

    // 6. Seed Analytics
    const now = new Date();
    const analytics = [
      { offsetDays: 4, score: 75, completed: 2, missed: 0 },
      { offsetDays: 3, score: 80, completed: 3, missed: 1 },
      { offsetDays: 2, score: 92, completed: 4, missed: 0 },
      { offsetDays: 1, score: 95, completed: 5, missed: 0 }
    ];
    for (const a of analytics) {
      await prisma.analytics.create({
        data: {
          userId,
          date: new Date(now.getTime() - a.offsetDays * 24 * 60 * 60 * 1000),
          productivityScore: a.score,
          completedTasks: a.completed,
          missedTasks: a.missed
        }
      });
    }

  } catch (error) {
    console.error("Error seeding initial mock data for user:", error);
  }
}

// Helper to handle model transient errors and auto-retry/fallback gracefully
async function generateGeminiContentWithRetry(params: {
  contents: any;
  config?: any;
  systemInstruction?: string;
}) {
  if (!ai) throw new Error('Gemini API not configured');
  
  // We prioritize gemini-3.5-flash and fallback to gemini-3.1-flash-lite if overloaded
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  
  for (const model of modelsToTry) {
    let retries = 3;
    let delay = 1000;
    
    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            ...params.config,
            ...(params.systemInstruction ? { systemInstruction: params.systemInstruction } : {}),
          },
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err.message || '';
        const isTransient = 
          errMessage.includes('503') || 
          errMessage.includes('Service Unavailable') || 
          errMessage.includes('high demand') || 
          errMessage.includes('429') || 
          errMessage.includes('RESOURCE_EXHAUSTED') ||
          errMessage.includes('UNAVAILABLE');

        if (errMessage.includes('401') || errMessage.includes('UNAUTHENTICATED')) {
          console.error("Gemini API Auth Error: Please check your GEMINI_API_KEY or harika_key in the environment variables.");
          throw new Error('Gemini API Authentication failed. Please ensure your API key is correctly set.');
        }
          
        if (isTransient) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
            continue;
          }
        }
        break;
      }
    }
  }
  
  throw lastError || new Error('Failed to generate content from Gemini API');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-for-hackathon-only';
const PORT = 3000;

// --- AUTH MIDDLEWARE ---
export interface AuthRequest extends Request {
  userId?: string;
}

const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify that the user still exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    if (!userExists) {
      return res.status(401).json({ error: 'Unauthorized: User does not exist' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });
    // Seed high-fidelity sample workspace data immediately so they never see an empty app
    await seedUserData(user.id);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    // Auto-seed if the workspace is empty
    await seedUserData(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASK ROUTES ---
app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const existingCount = await prisma.task.count({ where: { userId: req.userId } });
    if (existingCount === 0) {
      await seedUserData(req.userId);
    }
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: { aiPlans: true },
      orderBy: [
        { priority: 'asc' }, // Warning: Wait we need better ordering based on aiScore maybe
        { deadline: 'asc' }
      ]
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        ...req.body,
        userId: req.userId
      }
    });
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id, userId: req.userId },
      data: req.body
    });
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI ANALYZE TASK ---
app.post('/api/ai/analyze-task', requireAuth, async (req: AuthRequest, res) => {
  if (!ai) return res.status(500).json({ error: 'Gemini API not configured' });
  try {
    const { text } = req.body;
    const prompt = `Analyze the following task description and extract the details.
Return ONLY a valid JSON object matching this schema:
{
  "title": string (A concise task title, e.g., "Interview Preparation"),
  "description": string (rephrased input or empty),
  "deadline": string (ISO 8601 date, or null),
  "priority": "Critical" | "High" | "Medium" | "Low",
  "difficulty": "High" | "Medium" | "Low",
  "estimatedTime": number (estimated minutes to complete, or null)
}
Input task description: "${text}"`;

    let parsed;
    try {
      const response = await generateGeminiContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      const output = response.text || "{}";
      parsed = JSON.parse(output);
    } catch (aiError: any) {
      console.warn("AI extraction failed, using fallback:", aiError.message);
      parsed = {
        title: text.substring(0, 50) || "New Task",
        description: text,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        priority: "Medium",
        difficulty: "Medium",
        estimatedTime: 60
      };
    }

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI BREAKDOWN TASK ---
app.post('/api/ai/create-plan', requireAuth, async (req: AuthRequest, res) => {
  if (!ai) return res.status(500).json({ error: 'Gemini API not configured' });
  try {
    const { taskId, description } = req.body;
    const prompt = `Break down the following task into 3 to 7 sequential actionable steps.
Task: "${description}"
Return ONLY a valid JSON Array of strings representing the steps. Example: ["Step 1 format", "Step 2 format"]`;
    
    let steps: string[];
    try {
      const response = await generateGeminiContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      steps = JSON.parse(response.text || "[]");
    } catch (aiError: any) {
      console.warn("AI plan creation failed, using fallback:", aiError.message);
      steps = [
        "Review task requirements",
        "Set up necessary tools",
        "Execute core work",
        "Review and finalize"
      ];
    }
    
    // Save to DB
    const plans = await Promise.all(steps.map(step => 
       prisma.aIPlan.create({
         data: {
           taskId,
           step
         }
       })
    ));

    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI RISK PREDICTOR ---
app.post('/api/ai/risk-analysis', requireAuth, async (req: AuthRequest, res) => {
  if (!ai) return res.status(500).json({ error: 'Gemini API not configured' });
  try {
    const { taskId, title, description, deadline, priority, estimatedTime } = req.body;
    
    const prompt = `Analyze this task for deadline risk. 
Consider: 
- Time remaining until deadline (current time: ${new Date().toISOString()})
- Estimated time: ${estimatedTime} mins
- Priority: ${priority}
Task: ${title} - ${description || ''}
Deadline: ${deadline}

Return ONLY a JSON object:
{
  "riskLevel": "Low" | "Medium" | "High",
  "riskReason": string (short 1-2 sentence reason why it is this risk level, e.g. "Deadline is in 2 hours but requires 4 hours of work.")
}`;
    
    let output;
    try {
      const response = await generateGeminiContentWithRetry({
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      output = JSON.parse(response.text || '{"riskLevel":"Low", "riskReason": "Unable to analyze"}');
    } catch (aiError: any) {
      console.warn("AI risk analysis failed, using fallback:", aiError.message);
      output = {
        riskLevel: "Medium",
        riskReason: "Fallback analysis: Please proceed carefully with your deadline."
      };
    }
    
    // Update the task with the risk analysis
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId, userId: req.userId },
        data: { riskLevel: output.riskLevel, riskReason: output.riskReason }
      });
    }

    res.json(output);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- LAST MINUTE RESCUE MODE ---
app.post('/api/ai/rescue-plan', requireAuth, async (req: AuthRequest, res) => {
  if (!ai) return res.status(500).json({ error: 'Gemini API not configured' });
  try {
    const { taskId, title, description, deadline, timeRemaining } = req.body;
    
    const prompt = `This task is at HIGH risk of missing its deadline. Generate a strict emergency execution "Rescue Plan".
Task: ${title} - ${description || ''}
Deadline: ${deadline}
Time Remaining: ${timeRemaining}

Create an hour-by-hour (or minute-by-minute) breakdown to forcefully finish it on time. Focus ONLY on critical path.
Return ONLY a JSON object:
{
  "plan": [
    { "timeframe": "Hour 1", "action": "Research core concepts" },
    { "timeframe": "Hour 2-3", "action": "Draft main points" }
  ]
}`;
    
    let output;
    try {
      const response = await generateGeminiContentWithRetry({
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      output = JSON.parse(response.text || '{"plan":[]}');
    } catch (aiError: any) {
      console.warn("AI rescue plan failed, using fallback:", aiError.message);
      output = {
        plan: [
          { timeframe: "Now", action: "Stop distractions and focus immediately" },
          { timeframe: "Next Hour", action: "Complete the highest priority sub-task" },
          { timeframe: "Before Deadline", action: "Finalize and submit the work" }
        ]
      };
    }
    const planStr = JSON.stringify(output.plan);

    // Save rescue plan to task
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId, userId: req.userId },
        data: { riskLevel: 'High', rescuePlan: planStr }
      });
    }

    res.json(output.plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DASHBOARD DATA ---
app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const existingCount = await prisma.task.count({ where: { userId: req.userId } });
    if (existingCount === 0) {
      await seedUserData(req.userId);
    }
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: { aiPlans: true }
    });

    // Compute metrics
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const today = new Date();
    // Simplified: any task with deadline today or overdue
    const priorityTasks = tasks.filter(t => t.priority === 'Critical' || t.priority === 'High');
    const score = completedTasks * 10 - tasks.filter(t => t.status === 'Overdue').length * 5;

    res.json({
      metrics: {
        score: Math.max(0, score),
        completedCount: completedTasks,
        pendingCount: pendingTasks,
        totalTasks: tasks.length
      },
      priorityTasks,
      recentTasks: tasks.slice(0, 5)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI CHATBOT ---
app.post('/api/ai/chat', requireAuth, async (req: AuthRequest, res) => {
  if (!ai) return res.status(500).json({ error: 'Gemini API not configured' });
  try {
    const { message, history } = req.body;

    // Fetch user's tasks to give AI context
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      select: { title: true, status: true, priority: true, deadline: true, riskLevel: true }
    });

    const tasksContext = tasks.length > 0 
      ? `Here is the user's current task list:\n${JSON.stringify(tasks, null, 2)}` 
      : `The user has no tasks scheduled right now.`;

    const systemInstruction = `You are LifePilot AI, an intelligent agent that plans, predicts, prioritizes, and helps users complete tasks before deadlines. Provide actionable, concise productivity guidance.
    
Context:
${tasksContext}

When the user asks about their schedule, use this context to answer. If a task is at high risk, warn them and suggest focusing on it. You can suggest moving tasks around, explain delays, and motivate them.`;

    // To properly use history with Gemini, we should format it. But since this is a simple text generation based on the last message, we can just append the last few history messages to the context.
    const recentHistory = history?.slice(-4).map((m: any) => `${m.sender}: ${m.text}`).join('\n') || '';
    
    const finalPrompt = `${recentHistory}\nUser: ${message}\nLifePilot AI:`;

    let responseText = "";
    try {
      const response = await generateGeminiContentWithRetry({
        contents: finalPrompt,
        systemInstruction
      });
      responseText = response.text || "";
    } catch (aiError: any) {
      console.warn("AI chat failed, using fallback:", aiError.message);
      responseText = "I'm having trouble connecting to my AI brain right now, but I can see you have some tasks. Keep focusing on your highest priority items!";
    }

    res.json({ text: responseText });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FORCE SEED ROUTE ---
app.post('/api/seed-sample', requireAuth, async (req: AuthRequest, res) => {
  try {
    await seedUserData(req.userId, true);
    res.json({ success: true, message: "Sample dataset successfully seeded!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vite Middleware & Server start ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Ensure you have GROQ_API_KEY in your backend/.env file
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });

router.post('/generate-question', async (req, res) => {
  try {
    const { role, resumeText, previousAnswer } = req.body;
    
    // We can adjust difficulty based on previous answer if we had more complex tracking
    let prompt = `You are an expert technical interviewer conducting an interview for a ${role} position. `;
    
    if (resumeText && resumeText.length > 50) {
      prompt += `The candidate's resume includes the following text: ${resumeText.substring(0, 1000)}... `;
      prompt += `Ask a challenging, relevant interview question based specifically on their experience or skills listed. `;
    } else {
      prompt += `Ask a standard, challenging technical interview question for this role. `;
    }

    if (previousAnswer) {
      prompt += `The candidate just answered a previous question with: "${previousAnswer}". Follow up or move to a new topic based on this. `;
    }

    prompt += `Output ONLY the question text without any extra conversation or formatting.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
    });

    const questionText = completion.choices[0]?.message?.content || "";

    res.json({ question: questionText.trim() });
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

router.post('/evaluate', async (req, res) => {
  try {
    const { questionsAndAnswers } = req.body; // Array of { question, answer }
    
    const prompt = `You are an expert technical interviewer evaluating a candidate's performance. 
    Here is the transcript of the interview:
    ${JSON.stringify(questionsAndAnswers)}
    
    Provide a score out of 100 for each of the following categories:
    - Technical Accuracy
    - Communication
    - Confidence
    - Clarity
    
    Also provide a short "Strengths" paragraph and an "Areas for Improvement" paragraph.
    Format your response EXACTLY as valid JSON with the following structure:
    {
      "scores": {
        "Technical Accuracy": number,
        "Communication": number,
        "Confidence": number,
        "Clarity": number
      },
      "strengths": "string",
      "improvements": "string"
    }
    Output ONLY the JSON and nothing else.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" }
    });
    
    let rawText = completion.choices[0]?.message?.content || "{}";
    
    const evaluation = JSON.parse(rawText);
    res.json(evaluation);

  } catch (error) {
    console.error('Error evaluating interview:', error);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

const InterviewSession = require('../models/InterviewSession');

router.post('/save-session', async (req, res) => {
  try {
    const { clerkUserId, role, evaluation, fillerWordCount } = req.body;
    
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = new InterviewSession({
      clerkUserId,
      role,
      evaluation,
      fillerWordCount
    });

    await session.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ clerkUserId: req.params.userId }).sort({ date: -1 });
    
    // Calculate basic streak (consecutive days played from today backwards)
    let streak = 0;
    let today = new Date();
    today.setHours(0,0,0,0);

    const dates = sessions.map(s => {
      const d = new Date(s.date);
      d.setHours(0,0,0,0);
      return d.getTime();
    });

    const uniqueDates = [...new Set(dates)].sort((a,b) => b - a);

    if (uniqueDates.length > 0) {
      const mostRecent = uniqueDates[0];
      const diffDays = Math.floor((today.getTime() - mostRecent) / (1000 * 3600 * 24));
      
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const expectedPrevDay = uniqueDates[i-1] - (1000 * 3600 * 24);
          if (uniqueDates[i] === expectedPrevDay) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({ sessions, streak });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;

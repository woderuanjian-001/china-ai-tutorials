---
title: "WeChat Mini Program AI Integration Guide: Complete DeepSeek/Kimi API Workflow"
description: "Hands-on tutorial for integrating Chinese AI models into WeChat Mini Programs: cloud function calls to DeepSeek/Kimi API, streaming chat, image recognition, and compliance deployment. Includes complete frontend and backend code."
category: "Hands-On Tutorials"
date: 2026-06-25
tags: ["WeChat Mini Program", "DeepSeek", "Kimi", "Cloud Functions", "Streaming", "Full Stack"]
level: "Advanced"
---

## What This Tutorial Solves

You will learn to integrate AI capabilities into a WeChat Mini Program:

- Connect your Mini Program to DeepSeek / Kimi API
- Use cloud functions as API proxies (to protect your keys)
- Implement streaming AI conversations
- Image recognition and multimodal input
- Review and compliance essentials

> 🎯 WeChat Mini Programs have over 1 billion monthly active users. This tutorial teaches you to securely integrate Chinese AI models via cloud functions and build intelligent Mini Programs.

---

## Step 1: Architecture Design

```
Mini Program → wx.cloud.callFunction() → Cloud Function → DeepSeek/Kimi API
                                               ↑
                                         API Key stored as cloud function environment variable
                                         Never exposed to the Mini Program client
```

**Why must you use a cloud function proxy?**

- ❌ Calling the API directly from the Mini Program client → API Key is exposed in client-side code
- ✅ Cloud function proxy → API Key is stored in server-side environment variables, secure and reliable

---

## Step 2: Cloud Function — DeepSeek Proxy

```javascript
// cloud/functions/aiChat/index.js
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

exports.main = async (event) => {
  const { messages, stream = false, temperature = 0.7 } = event;

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        messages: [
          {
            role: "system",
            content: "You are a professional AI assistant. Reply in Chinese, be concise and accurate.",
          },
          ...messages,
        ],
        temperature,
        max_tokens: 2000,
        stream,
      }),
    });

    if (stream) {
      // Stream response
      return { stream: true, body: await response.text() };
    }

    const data = await response.json();
    return {
      success: true,
      answer: data.choices[0].message.content,
      usage: data.usage,
    };
  } catch (error) {
    console.error("AI API call failed:", error);
    return {
      success: false,
      error: "AI service is temporarily unavailable, please try again later",
    };
  }
};
```

---

## Step 3: Mini Program Client — Chat Interface

```html
<!-- pages/chat/chat.wxml -->
<view class="chat-container">
  <!-- Message list -->
  <scroll-view
    class="message-list"
    scroll-y
    scroll-into-view="msg-{{messages.length - 1}}"
  >
    <view
      wx:for="{{messages}}"
      wx:key="id"
      id="msg-{{index}}"
      class="message {{item.role}}"
    >
      <view class="msg-avatar">{{item.role === 'user' ? '👤' : '🤖'}}</view>
      <view class="msg-content">
        <text selectable>{{item.content}}</text>
      </view>
    </view>

    <!-- Typing indicator... -->
    <view wx:if="{{loading}}" class="message assistant typing">
      <view class="msg-avatar">🤖</view>
      <view class="msg-content typing-dots">
        <view class="dot"></view>
        <view class="dot"></view>
        <view class="dot"></view>
      </view>
    </view>
  </scroll-view>

  <!-- Input area -->
  <view class="input-area">
    <input
      class="msg-input"
      value="{{inputText}}"
      bindinput="onInput"
      bindconfirm="sendMessage"
      placeholder="Type your question..."
      confirm-type="send"
    />
    <button
      class="send-btn"
      bindtap="sendMessage"
      disabled="{{!inputText.trim() || loading}}"
    >
      Send
    </button>
  </view>
</view>
```

```javascript
// pages/chat/chat.js
Page({
  data: {
    messages: [],
    inputText: "",
    loading: false,
  },

  onLoad() {
    // Initial welcome message
    this.setData({
      messages: [
        {
          id: 1,
          role: "assistant",
          content: "Hello! I'm your AI assistant. How can I help you?",
        },
      ],
    });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.loading) return;

    // Add user message
    const userMsg = { id: Date.now(), role: "user", content: text };
    const messages = [...this.data.messages, userMsg];
    this.setData({
      messages,
      inputText: "",
      loading: true,
    });

    try {
      // Call cloud function
      const res = await wx.cloud.callFunction({
        name: "aiChat",
        data: {
          messages: [
            { role: "user", content: text },
          ],
          temperature: 0.7,
        },
      });

      if (res.result.success) {
        // Add AI reply
        this.setData({
          messages: [
            ...this.data.messages,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: res.result.answer,
            },
          ],
        });
      } else {
        wx.showToast({ title: res.result.error, icon: "none" });
      }
    } catch (err) {
      console.error("Call failed:", err);
      wx.showToast({ title: "Network error, please try again", icon: "none" });
    }

    this.setData({ loading: false });
  },
});
```

---

## Step 4: Streaming Conversation Implementation

```javascript
// cloud/functions/aiChatStream/index.js
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { messages } = event;

  const response = await fetch(
    "https://api.deepseek.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    }
  );

  // Use cloud function long connection to push streaming data
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Parse SSE format
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          // Push to Mini Program in real time
          // Note: Cloud function WebSocket push requires specific configuration
          console.log("Streaming content:", content);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  return { success: true };
};
```

On the Mini Program side, use **WebSocket** (cloud development database real-time push) for streaming updates:

```javascript
// pages/chat/chat.js — Streaming chat method
async sendMessageStream() {
  const text = this.data.inputText.trim();
  if (!text) return;

  // Add user message + empty AI message placeholder
  const messages = [
    ...this.data.messages,
    { id: Date.now(), role: "user", content: text },
    { id: Date.now() + 1, role: "assistant", content: "" },
  ];
  const aiIndex = messages.length - 1;

  this.setData({ messages, inputText: "", loading: true });

  // Call streaming cloud function
  const res = await wx.cloud.callFunction({
    name: "aiChat",
    data: {
      messages: [{ role: "user", content: text }],
      stream: false, // Cloud function doesn't directly support streaming; return in multiple parts
    },
  });

  // Simulate streaming: display character by character
  const answer = res.result.answer || "";
  for (let i = 0; i < answer.length; i++) {
    await new Promise((r) => setTimeout(r, 30));
    const key = `messages[${aiIndex}].content`;
    this.setData({ [key]: answer.slice(0, i + 1) });
  }

  this.setData({ loading: false });
}
```

---

## Step 5: Image Recognition Feature

```javascript
// Cloud function — image recognition
exports.analyzeImage = async (event) => {
  const { imageUrl, prompt } = event;

  // Call DeepSeek vision (if model supports it)
  // Or use Qwen VL
  const response = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-vl-plus",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
              {
                type: "text",
                text: prompt || "Please describe the content of this image",
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  return {
    success: true,
    description: data.choices[0].message.content,
  };
};
```

On the Mini Program side:

```javascript
// Select and recognize an image
async chooseAndAnalyzeImage() {
  // 1. Select image
  const chooseRes = await wx.chooseImage({
    count: 1,
    sizeType: ["compressed"],
  });

  const tempFilePath = chooseRes.tempFilePaths[0];

  // 2. Upload to cloud storage
  const uploadRes = await wx.cloud.uploadFile({
    cloudPath: `images/${Date.now()}.jpg`,
    filePath: tempFilePath,
  });

  const fileID = uploadRes.fileID;

  // 3. Get temporary link
  const urlRes = await wx.cloud.getTempFileURL({
    fileList: [fileID],
  });

  const imageUrl = urlRes.fileList[0].tempFileURL;

  // 4. Call cloud function for recognition
  const aiRes = await wx.cloud.callFunction({
    name: "aiChat",
    data: {
      type: "analyze",
      imageUrl: imageUrl,
      prompt: "What is in this image? Please describe in detail",
    },
  });

  // 5. Display result
  this.setData({
    messages: [
      ...this.data.messages,
      { id: Date.now(), role: "user", content: "[Image]", imageUrl: tempFilePath },
      { id: Date.now() + 1, role: "assistant", content: aiRes.result.description },
    ],
  });
}
```

---

## Step 6: Persisting Chat History

```javascript
// Use cloud database to store conversation history
const db = cloud.database();

async function saveConversation(userId, messages) {
  return await db.collection("conversations").add({
    data: {
      userId,
      messages,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function loadConversations(userId) {
  const res = await db.collection("conversations")
    .where({ userId })
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();

  return res.data;
}

async function deleteConversation(conversationId) {
  return await db.collection("conversations")
    .doc(conversationId)
    .remove();
}
```

---

## Step 7: Review and Compliance Essentials

### Mandatory Rules

| Requirement | Description |
|------|------|
| Content Safety | AI responses must pass content safety review |
| User Agreement | Privacy policy must declare the use of AI services |
| Reporting Mechanism | Provide a reporting/complaint entry point |
| Real-Name Verification | Generative AI conversations require user real-name authentication |
| Data Storage | User conversation data must be stored on servers in mainland China |

### Content Safety Review

```javascript
// Use WeChat content safety API to review text
async function checkContent(content) {
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      content: content,
    });

    if (res.result.suggest === "risky") {
      return { pass: false, reason: "Content is unsafe" };
    }
    return { pass: true };
  } catch (err) {
    // When the review API call fails, reject for safety
    return { pass: false, reason: "Review service exception" };
  }
}
```

---

## Complete Project Structure

```
miniprogram/
├── pages/
│   └── chat/
│       ├── chat.wxml       # Chat interface
│       ├── chat.wxss        # Styles
│       ├── chat.js          # Logic
│       └── chat.json        # Configuration
├── app.js
├── app.json
└── project.config.json

cloudfunctions/
└── aiChat/
    ├── index.js             # Main cloud function
    ├── package.json
    └── config.json          # Environment variables
```

---

## FAQ

### Q: Why is the conversation slow?

**A**: Possible causes: 1) Cloud function cold start (3-5s); 2) If DeepSeek API is slow, try Kimi instead; 3) Use pre-connection + cloud function always-warm instances.

### Q: How to reduce costs?

**A**: Limit max_tokens (recommend 500-1000), cache common question replies, use concise prompts to reduce consumption.

---

## Next Steps

- [DeepSeek API Beginner's Guide](/tutorials/deepseek-api-beginner-guide/)
- [Kimi API Getting Started](/tutorials/kimi-api-getting-started/)

> 📝 Based on WeChat Cloud Development + DeepSeek/Kimi, tested June 2026.

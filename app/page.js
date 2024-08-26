"use client"
import Image from "next/image";
import { useState } from "react"; 
import {Box, Stack, TextField, Button, Typography, IconButton} from "@mui/material"
import SendIcon from '@mui/icons-material/Send';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      "role": "assistant",
      "content": "Hello, I am the Rate My Professor support assistant. How can I help you today?"
    }
  ])

  const [message, setMessage] = useState("")

  const sendMessage = async () => {
    setMessages((messages)=>[
      ...messages, //put the previous messages, then add a new one
      {role: "user", content: message},
      {role: "assistant", content: ""},
    ])
    setMessage("")
  
    const response = fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify([...messages, {role: "user", content: message}])
    }).then(async(res)=>{
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      let result = ""
      return reader.read().then(function processText({done, value}){
        if (done){
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        //makes sure yout variables behave as expected
        setMessages((messages)=>{
          let lastMessage = messages[messages.length -1]
          let otherMessages = messages.slice(0, messages.length -1)
          return[
            //return previous messages
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText) // call the function -recursive
      })
    })
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
    >
      {/* Typing Animation Title */}
      <Box
        width="100%"
        py={2}
        textAlign="center"
      >
        <Typography variant="h3" className="typing">
          Rate My Professor AI
        </Typography>
      </Box>

      <Stack
        direction="column"
        width="500px"
        height="600px"
        border="1px solid black"
        borderRadius={8}
        boxShadow={3}
        p={2}
        spacing={3}
        display="flex"
        flexDirection="column"
        bgcolor="white"
      >
        <Stack 
          direction="column" 
          spacing={2} 
          flexGrow={1} 
          overflow="auto"
          maxHeight="100%"
        >
          {
            messages.map((message, index) => (
              <Box 
                key={index} 
                display="flex" 
                justifyContent={
                  message.role === "assistant" ? "flex-start" : "flex-end"
                }
              >
                <Box 
                  bgcolor={
                    message.role === "assistant" ? "primary.main" : "secondary.main"
                  }
                  color="white"
                  borderRadius={16}
                  p={2}
                  maxWidth="80%"
                  boxShadow={2}
                >
                  {message.content}
                </Box>
              </Box>
            ))
          }
        </Stack>
        <Stack direction="row" spacing={2} mt={2}>
          <TextField
            label="Type your message..."
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <IconButton color="primary" onClick={sendMessage}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Footer */}
      <Box
        width="100%"
        py={1}
        bgcolor="black"
        color="white"
        textAlign="center"
      >
        <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>© 2024 Team Name | Headstarter Fellowship</Typography>
      </Box>
    </Box>
  );
}

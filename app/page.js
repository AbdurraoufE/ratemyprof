"use client"
import Image from "next/image";
import { useState, useEffect } from "react"; 
import {Box, Stack, TextField, Button} from "@mui/material"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/app/firebase/config"
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

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

  const [user] = useAuthState(auth);
  const router = useRouter();
  const [userSession, setUserSession] = useState("user");
  const [loadingTime, setLoading] = useState(false);

  // check if user is authenticated
  if (!user && !userSession) {
    router.push("/signup")
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserSession(sessionStorage.getItem("user"));
    }
  }, []);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
        display="flex"
        flexDirection="column"
      >
        <Stack 
          direction="column" 
          spacing={2} 
          flexGrow={1} 
          overflow="auto"
          maxHeight="100%"
        >
        <Button
          variant="outlined"
          sx={{color:"#000", backgroundColor:"#ff6161", "&:hover": {backgroundColor: "#f24646"}}}
          onClick={() => {
            signOut(auth);
            sessionStorage.removeItem("user");
            router.push("/signup");
          }}
        >
          Sign Out
        </Button>
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
                  color="white" //text color
                  borderRadius={16}
                  p={3}
                  maxWidth="80%" // optional, to ensure messages don't overflow
                >
                  {message.content}
                </Box>
              </Box>
            ))
          }
        </Stack>
        <Stack direction="row" spacing={2} mt={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

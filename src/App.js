
import { useEffect, useState, useRef } from 'react';
import { Box, Container, VStack, Button, Input, HStack } from '@chakra-ui/react'
import Message from './Message';
import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { app } from './Firebase';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'



const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)

};

const singoutHandeler = () => signOut(auth);




function App() {

  const [user, setUser] = useState(false)
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef(null);


  
  
  
  const submitHandler = async (e) => {
    e.preventDefault();
    
    try {
      setMessage("");
      
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });
      divForScroll.current.scrollIntoView({ behavior: "smooth" });
      
    } catch (error) {
      alert(error);
      
    }
  }
  
    useEffect(() => {
      const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"));
      const unsubscribe = onAuthStateChanged(auth, (data) => {
        setUser(data);
      })
      const unsubscribeForMessage = onSnapshot(q, (snap) => {
        setMessages(
          snap.docs.map((item) => {
            const id = item.id;
            return { id, ...item.data() };
          })
        );
  
      });
  
      return () => {
        unsubscribe();
        unsubscribeForMessage();
      };
    }, []);



  return <Box bg={"blue.50"}>
    {
      user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack h="full" w="full" padding={"2"}>
            <Button onClick={singoutHandeler} colorScheme={"red"} w={"full"}>Logout</Button>

            <VStack h="full" width={"full"} overflowY={"auto"} scrollBehavior="smooth" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
              {
                messages.map((item) => (
                  <Message key={item.id} 
                  text={item.text}
                  user={item.uid === user.uid ? "me" : "other"} 
                  uri={item.uri} 
                  />
                ))
              }
              <div ref={divForScroll}></div>
            </VStack>

            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack h="full" w="full">
                <Input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder='Enter a message....' />
                <Button type="submit" borderRadius="40" bg={"purple"} color="white">Send</Button>
              </HStack>
            </form>
          </VStack>


        </Container>
      ) : <VStack justifyContent={'center'} h='100vh'>
        <Button onClick={loginHandler} color="white" bg={"purple"}>Sing In With Google</Button>
      </VStack>
    }
  </Box>;
}

export default App;

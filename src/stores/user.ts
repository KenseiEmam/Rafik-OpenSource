import { ref} from 'vue'
import { defineStore } from 'pinia'
interface UserInterface  {
  id?:string,
  email?:string,
  full_name?:string
}
interface Session {
  access_token?:string,
  refresh_token?:string,
  expires_in?: number,
  expires_at?: number,
}
export const useUserStore = defineStore('User', () => {
  const User= ref<UserInterface>({
  })
  const session = ref<Session>({})

  function LogIn(data:UserInterface, sesh:Session) {
    User.value.id =data.id
    User.value.email= data.email
    session.value = {
      access_token:sesh.access_token,
      refresh_token:sesh.refresh_token,
      expires_in: sesh.expires_in,
      expires_at: sesh.expires_at,
    }
    if(User.value.id)
      localStorage.setItem('LoggedInUser', User.value.id)
    if(session.value.access_token)
      localStorage.setItem('AccessToken', session.value.access_token)
  }
  function LogOut() {
    User.value={
    }
    session.value = {}
    localStorage.removeItem('LoggedInUser')
    localStorage.removeItem('AccessToken')
  }

  return { User, LogIn, LogOut }
})

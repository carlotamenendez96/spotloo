// Route guards for authentication
import { isLoggedIn } from '../services/userService.js'

/**
 * Auth guard - redirects to home if user is not logged in
 * @param {Object} to - Route being navigated to
 * @param {Object} from - Route being navigated from
 * @param {Function} next - Navigation function
 */
export const authGuard = (to, from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    console.log('Auth guard: User not logged in, redirecting to home')
    next('/')
  } else {
    next()
  }
}

/**
 * Guest guard - redirects to home if user is already logged in
 * @param {Object} to - Route being navigated to
 * @param {Object} from - Route being navigated from
 * @param {Function} next - Navigation function
 */
export const guestGuard = (to, from, next) => {
  if (to.meta.requiresGuest && isLoggedIn.value) {
    console.log('Guest guard: User already logged in, redirecting to home')
    next('/')
  } else {
    next()
  }
}

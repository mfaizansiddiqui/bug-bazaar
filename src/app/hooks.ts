import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, AppState } from './store'

/** Typed versions of the react-redux hooks. Use these instead of the plain ones. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<AppState>()

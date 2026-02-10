import React, { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useLocation } from 'react-router-dom'
import PrintingAnimation from './PrintingAnimation'

const Loading = () => {

  const { navigate } = useAppContext()
  let { search } = useLocation()
  const query = new URLSearchParams(search)
  const nextUrl = query.get('next');

  useEffect(() => {
    if (nextUrl) {
      setTimeout(() => {
        navigate(`/${nextUrl}`)
      }, 5000)
    }
  }, [nextUrl])

  return <PrintingAnimation />
}

export default Loading

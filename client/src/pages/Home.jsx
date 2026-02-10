import React from 'react'
import MainBanner from '../components/MainBanner'
import Categories from '../components/Categories'
import BottomBanner from '../components/BottomBanner'

const Home = () => {
  return (
    <div className='mt-10 space-y-24'>
      <MainBanner />
      <Categories />
      <BottomBanner />
    </div>
  )
}

export default Home

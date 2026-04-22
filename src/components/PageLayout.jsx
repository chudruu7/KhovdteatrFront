import React from 'react'
import Header from './Header'
import Footer from './Footer'

export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-gray-100">
      <Header />
      <main className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

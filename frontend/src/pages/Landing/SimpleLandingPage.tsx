import React from 'react';
import { useNavigate } from 'react-router-dom';

// NOTE: This component is a React/Tailwind adaptation of the provided Figma export HTML.
// Some non-standard Tailwind utility classes from the export (e.g. size-full, tracking-light, container query variants @[])
// have been mapped to standard Tailwind classes for compatibility.

const SimpleLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex w-full min-h-screen flex-col bg-white font-sans overflow-x-hidden">
      {/* Wrapper */}
      <div className="flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#f0f2f5] px-6 md:px-10 py-3">
          <div className="flex items-center gap-3 md:gap-4 text-[#111418]">
            <div className="w-5 h-5 text-primary-600">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-[#111418] text-lg font-bold tracking-tight">Delhi Waste Management</h2>
          </div>
          <div className="flex flex-1 justify-end gap-6 md:gap-8 items-center">
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-[#111418] text-sm font-medium hover:text-primary-600" href="#features">Features</a>
              <a className="text-[#111418] text-sm font-medium hover:text-primary-600" href="#metrics">Metrics</a>
              <a className="text-[#111418] text-sm font-medium hover:text-primary-600" href="#contact" onClick={(e)=>{e.preventDefault();navigate('/app/dashboard');}}>Dashboard</a>
            </nav>
            <button
              onClick={()=>navigate('/app/dashboard')}
              className="flex items-center justify-center rounded-lg h-10 px-4 bg-[#0d80f2] text-white text-sm font-bold shadow hover:bg-[#0b6ecf] transition-colors"
            >
              <span className="truncate">Request Demo</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-6 md:py-10">
          <div className="flex flex-col w-full max-w-[960px]">
            {/* Hero Section */}
            <section className="mb-10">
              <div
                className="flex min-h-[420px] md:min-h-[480px] flex-col gap-6 md:gap-8 items-center justify-center rounded-lg p-6 md:p-8 bg-cover bg-center bg-no-repeat text-center bg-[linear-gradient(rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.4)_100%),url('https://lh3.googleusercontent.com/aida-public/AB6AXuA0R4yBdZdJbgbkzj9sNQQAvHSrHsbFR-dzN7YYsf-gR9TxJ5Bk5h95uZ4nDl5u1B5ihgT4BS1hkRk1NjtNgvT8j28QFuY1MOvLrtj693RrWlU2Hy0_ypXkjulI_9-QPK3XBZ8zDDRtbZb27Rgze8j_MMgVmDtGFNpy5JCU0O_of8t-v9BCD7fnhA8WHWAL_stFsmQURsk4JZMY2cGcozhmJ6fNI-9rUdrEn7cX7dYFo7tQZ-jmFds1I5E0Q41fEYlNTHMRVIR74e4M')]"
              >
                <div className="flex flex-col gap-4 max-w-3xl">
                  <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight">Revolutionizing Waste Management in Delhi</h1>
                  <p className="text-white text-sm md:text-base font-normal leading-relaxed">
                    Our innovative system ensures a cleaner, healthier environment for all residents. Join us in making Delhi a model city for sustainable waste management.
                  </p>
                </div>
                <button
                  onClick={()=>navigate('/app/dashboard')}
                  className="flex items-center justify-center rounded-lg h-11 md:h-12 px-6 bg-[#0d80f2] text-white text-sm md:text-base font-bold hover:bg-[#0b6ecf] transition-colors"
                >
                  Learn More
                </button>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="flex flex-col gap-6 md:gap-8 py-6 md:py-10">
              <div className="flex flex-col gap-4">
                <h2 className="text-[#111418] text-3xl md:text-4xl font-bold tracking-tight max-w-2xl">Key Features</h2>
                <p className="text-[#111418] text-base leading-relaxed max-w-2xl">
                  Our system integrates advanced technologies to optimize waste collection, processing, and recycling, ensuring efficiency and sustainability.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[
                  {
                    title: 'Smart Waste Collection',
                    body: 'Real-time monitoring and optimized routes for timely and efficient waste collection.',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#111418]"> <path d="M96,208a8,8,0,0,1-8,8H40a24,24,0,0,1-20.77-36l34.29-59.25L39.47,124.5A8,8,0,1,1,35.33,109l32.77-8.77a8,8,0,0,1,9.8,5.66l8.79,32.77A8,8,0,0,1,81,148.5a8.37,8.37,0,0,1-2.08.27,8,8,0,0,1-7.72-5.93l-3.8-14.15L33.11,188A8,8,0,0,0,40,200H88A8,8,0,0,1,96,208Zm140.73-28-23.14-40a8,8,0,0,0-13.84,8l23.14,40A8,8,0,0,1,216,200H147.31l10.34-10.34a8,8,0,0,0-11.31-11.32l-24,24a8,8,0,0,0,0,11.32l24,24a8,8,0,0,0,11.31-11.32L147.31,216H216a24,24,0,0,0,20.77-36ZM128,32a7.85,7.85,0,0,1,6.92,4l34.29,59.25-14.08-3.78A8,8,0,0,0,151,106.92l32.78,8.79a8.23,8.23,0,0,0,2.07.27,8,8,0,0,0,7.72-5.93l8.79-32.79a8,8,0,1,0-15.45-4.14l-3.8,14.17L148.77,28a24,24,0,0,0-41.54,0L84.07,68a8,8,0,0,0,13.85,8l23.16-40A7.85,7.85,0,0,1,128,32Z" /></svg>
                    )
                  },
                  {
                    title: 'Efficient Transportation',
                    body: 'Eco-friendly vehicles and strategic logistics to minimize environmental impact.',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#111418]"><path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z"/></svg>
                    )
                  },
                  {
                    title: 'Data-Driven Optimization',
                    body: 'Analytics and reporting to continuously improve system performance and resource allocation.',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-[#111418]"><path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"/></svg>
                    )
                  }
                ].map(f => (
                  <div key={f.title} className="flex flex-col gap-3 rounded-lg border border-[#dbe0e6] bg-white p-4">
                    <div>{f.icon}</div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[#111418] text-base font-bold leading-tight">{f.title}</h3>
                      <p className="text-[#60758a] text-sm leading-normal">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Metrics */}
            <section id="metrics" className="flex flex-wrap gap-4 p-0 md:p-4">
              {[
                { label: 'Waste Recycled', value: '45%', change: '+15%', changeColor: 'text-[#078838]' },
                { label: 'Collection Efficiency', value: '92%', change: '+10%', changeColor: 'text-[#078838]' },
                { label: 'Carbon Emissions Reduced', value: '30%', change: '-20%', changeColor: 'text-[#e73908]' },
              ].map(stat => (
                <div key={stat.label} className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5]">
                  <p className="text-[#111418] text-base font-medium">{stat.label}</p>
                  <p className="text-[#111418] text-2xl font-bold leading-tight">{stat.value}</p>
                  <p className={`${stat.changeColor} text-base font-medium`}>{stat.change}</p>
                </div>
              ))}
            </section>

            {/* CTA */}
            <section className="py-10 md:py-20 text-center flex flex-col gap-6 items-center">
              <h2 className="text-[#111418] text-3xl md:text-4xl font-bold tracking-tight max-w-2xl">
                Ready to Transform Your Waste Management?
              </h2>
              <button
                onClick={()=>navigate('/app/dashboard')}
                className="flex items-center justify-center rounded-lg h-11 md:h-12 px-6 bg-[#0d80f2] text-white text-sm md:text-base font-bold hover:bg-[#0b6ecf] transition-colors"
              >
                Request a Demo
              </button>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-center bg-white border-t border-[#f0f2f5]">
          <div className="flex max-w-[960px] w-full flex-col text-center gap-6 px-5 py-10">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a className="text-[#60758a] text-base" href="#privacy">Privacy Policy</a>
              <a className="text-[#60758a] text-base" href="#terms">Terms of Service</a>
            </div>
            <p className="text-[#60758a] text-base">@2025 Delhi Waste Management. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SimpleLandingPage;
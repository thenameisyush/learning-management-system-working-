import React from 'react';
const DeskBookingCard = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">

      {/* Desk Info */}
      <div className="space-y-4">
        <div className="bg-black text-white rounded-xl px-4 py-2">
          <p className="font-semibold">Desk #3, Sales Pod</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold">Amenities</p>
          <div className="flex gap-2 flex-wrap text-sm">
            <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Ethernet</span>
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">27 Monitor</span>
            <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded">Adjustable Height</span>
          </div>
          <p className="text-sm text-gray-600">July 14, 10:30 am - 7:30 pm</p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-xl w-full">
          Automatically booked
        </button>
      </div>

      {/* User Info */}
      <div className="text-center space-y-4">
        <img
          src="https://randomuser.me/api/portraits/women/44.jpg"
          alt="User"
          className="w-16 h-16 mx-auto rounded-full border-2 border-pink-400"
        />
        <p className="font-semibold text-lg">See you at Athenahealth HQ!</p>
        <p className="text-sm text-gray-500">
          July 14, 10:30 am – 7:30 pm<br />
          Desk L5 in Sales POD
        </p>
        <button className="bg-pink-200 text-pink-800 px-4 py-2 rounded">
          Share my booking
        </button>
      </div>

      {/* Check-in Info */}
      <div className="relative">
        <div className="absolute top-0 right-0 bg-white p-2 rounded shadow-md text-sm">
          <p className="text-gray-700 font-semibold">Ashley checked you in!</p>
          <p className="text-gray-500">Your desk is on Floor 5 • 10m ago</p>
        </div>
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="Checked in"
          className="w-full h-60 object-cover rounded-xl mt-12"
        />
      </div>

    </div>
  );
};

export default DeskBookingCard;

import MyAttendance from '../Components/MyAttendance'

const AttendancePage = () => {
  return (
    <div>
      <div className="mx-[10%] w-[80%] self-center flex flex-col items-center justify-center gap-6 mb-20">
         
            <>
              <h1 className="text-3xl font-bold text-yellow-500">User Attendance</h1>
              <MyAttendance />
            </>
        </div>
    </div>
  )
}

export default AttendancePage

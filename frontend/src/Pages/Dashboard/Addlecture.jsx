import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import HomeLayout from "../../Layouts/HomeLayout";
import { addCourseLecture } from "../../Redux/Slices/LectureSlice";

const MAX_VIDEO_MB = 50; // matches the backend multer limit

const emptyForm = (id) => ({
    id,
    lecture: undefined,
    title: "",
    description: "",
    videoSrc: ""
});

function AddLecture() {

    const courseDetails = useLocation().state;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [userInput, setUserInput] = useState(emptyForm(courseDetails?._id));
    const [submitting, setSubmitting] = useState(false);

    function handleInputChange(e) {
        const {name, value} = e.target;
        setUserInput({
            ...userInput,
            [name]: value
        })
    }

    function handleVideo(e) {
        const video = e.target.files[0];
        if (!video) return;

        if (!video.type.startsWith("video/")) {
            toast.error("Please choose a video file");
            e.target.value = "";
            return;
        }

        if (video.size > MAX_VIDEO_MB * 1024 * 1024) {
            toast.error(`Video must be smaller than ${MAX_VIDEO_MB} MB`);
            e.target.value = "";
            return;
        }

        if (userInput.videoSrc) window.URL.revokeObjectURL(userInput.videoSrc);

        setUserInput({
            ...userInput,
            lecture: video,
            videoSrc: window.URL.createObjectURL(video)
        })
    }

    function removeVideo() {
        if (userInput.videoSrc) window.URL.revokeObjectURL(userInput.videoSrc);
        setUserInput({ ...userInput, lecture: undefined, videoSrc: "" });
    }

    async function onFormSubmit(e) {
        e.preventDefault();

        // VIDEO IS OPTIONAL - only title and description are required
        if(!userInput.title.trim() || !userInput.description.trim()) {
            toast.error("Title and description are required")
            return;
        }

        setSubmitting(true);
        const response = await dispatch(addCourseLecture(userInput));
        setSubmitting(false);

        if(response?.payload?.success) {
            setUserInput(emptyForm(courseDetails?._id));
            navigate(-1);
        }
    }

    useEffect(() => {
        if(!courseDetails) navigate("/courses");
    }, [])

    return (
        <HomeLayout>
            <div className="min-h-[90vh] text-white flex flex-col items-center justify-center gap-10 px-4 py-10">
                <div className="flex flex-col gap-5 p-4 shadow-[0_0_10px_black] w-full max-w-md rounded-lg">
                    <header className="flex items-center justify-center relative">
                        <button 
                            type="button"
                            className="absolute left-2 text-xl text-green-500"
                            onClick={() => navigate(-1)}
                        >
                            <AiOutlineArrowLeft />
                        </button>
                        <h1 className="text-xl text-yellow-500 font-semibold">
                            Add new lecture
                        </h1>
                    </header>
                    <form 
                        onSubmit={onFormSubmit} className="flex flex-col gap-3"
                    >

                        <input 
                            type="text"
                            name="title"
                            placeholder="enter the title of the lecture"
                            onChange={handleInputChange}
                            className="bg-transparent px-3 py-2 border"
                            value={userInput.title}
                        />
                        <textarea 
                            type="text"
                            name="description"
                            placeholder="enter the description of the lecture"
                            onChange={handleInputChange}
                            className="bg-transparent px-3 py-2 border resize-none overflow-y-scroll h-36"
                            value={userInput.description}
                        />

                        <p className="text-sm text-gray-300">
                            Video <span className="text-gray-400">(optional)</span> - you can add a video now or skip it and keep this lecture for notes, quizzes and assignments.
                        </p>

                        {userInput.videoSrc ? (
                            <div className="space-y-2">
                                <video 
                                    muted
                                    src={userInput.videoSrc}
                                    controls 
                                    controlsList="nodownload nofullscreen"
                                    disablePictureInPicture
                                    className="object-fill rounded-tl-lg rounded-tr-lg w-full"
                                >

                                </video>
                                <button
                                    type="button"
                                    onClick={removeVideo}
                                    className="text-sm text-red-400 underline"
                                >
                                    Remove video
                                </button>
                            </div>
                        ) : (
                            <div className="h-32 border border-dashed flex items-center justify-center cursor-pointer">
                                <label className="font-semibold text-cl cursor-pointer w-full h-full flex items-center justify-center" htmlFor="lecture">Choose a video (optional)</label>
                                <input type="file" className="hidden" id="lecture" name="lecture" onChange={handleVideo} accept="video/*" />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary py-1 font-semibold text-lg"
                        >
                            {submitting
                                ? "Saving..."
                                : userInput.lecture
                                    ? "Add lecture with video"
                                    : "Add lecture (no video)"}
                        </button>
                    </form>
                </div>
            </div>  
        </HomeLayout>
    )
}

export default AddLecture;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { toast } from "react-hot-toast";

import axiosInstance from "../../Helpers/axiosInstance";

const initialState = {
    courseData: []
}

export const getAllCourses = createAsyncThunk("/course/get", async () => {
    try {
        const response = axiosInstance.get("/courses");
        toast.promise(response, {
            loading: "loading course data...",
            success: "Courses loaded successfully",
            error: "Failed to get the courses",
        });

        return (await response).data.courses;
    } catch(error) {
        toast.error(error?.response?.data?.message);
    }
}); 

export const deleteCourse = createAsyncThunk("/course/delete", async (id) => {
    try {
        const response = axiosInstance.delete(`/courses/${id}`);
        toast.promise(response, {
            loading: "deleting course ...",
            success: "Courses deleted successfully",
            error: "Failed to delete the courses",
        });

        return (await response).data;
    } catch(error) {
        toast.error(error?.response?.data?.message);
    }
}); 

export const createNewCourse = createAsyncThunk("/course/create", async (data) => {
    try {
        let formData = new FormData();
        formData.append("title", data?.title);
        formData.append("description", data?.description);
        formData.append("category", data?.category);
        formData.append("createdBy", data?.createdBy);
        formData.append("thumbnail", data?.thumbnail);
        formData.append("instructorId", data?.instructor);

        
        // optional metadata
        if (data?.price !== "" && data?.price !== undefined) formData.append("price", data.price);
        if (data?.duration) formData.append("duration", data.duration);

        const response = axiosInstance.post("/courses", formData);
        toast.promise(response, {
            loading: "Creating new course",
            success: "Course created successfully",
            error: "Failed to create course"
        });

        return (await response).data

    } catch(error) {
        toast.error(error?.response?.data?.message);
    }
});


export const updateCourse = createAsyncThunk(
    "/course/update",
    async ({ id, data }) => {
        try {
            const formData = new FormData();

            if (data?.title !== undefined) {
                formData.append("title", data.title);
            }

            if (data?.description !== undefined) {
                formData.append("description", data.description);
            }

            if (data?.category !== undefined) {
                formData.append("category", data.category);
            }

            if (data?.createdBy !== undefined) {
                formData.append("createdBy", data.createdBy);
            }

            if (data?.instructor !== undefined) {
    formData.append("instructorId", data?.instructor);
}

            if (data?.price !== undefined && data.price !== "") {
                formData.append("price", data.price);
            }

            if (data?.duration !== undefined && data.duration !== "") {
                formData.append("duration", data.duration);
            }

            // New thumbnail only if user selected one
            if (data?.thumbnail) {
                formData.append("thumbnail", data.thumbnail);
            }

            const response = axiosInstance.put(
                `/courses/${id}`,
                formData
            );

            toast.promise(response, {
                loading: "Updating course...",
                success: "Course updated successfully",
                error: "Failed to update course",
            });

            return (await response).data;
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                "Failed to update course"
            );
        }
    }
);

const courseSlice = createSlice({
    name: "courses",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getAllCourses.fulfilled, (state, action) => {
            if(action.payload) {
                state.courseData = [...action.payload];
            }
        })
    }
});

export default courseSlice.reducer;
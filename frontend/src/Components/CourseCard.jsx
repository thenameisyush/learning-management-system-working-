import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function CourseCard({ data }) {
    const navigate = useNavigate();

    const { role } = useSelector((state) => state.auth);

    const canEdit = ["ADMIN", "TEACHER"].includes(role);

    const handleEdit = (e) => {
        e.stopPropagation();
        navigate(`/course/edit/${data?._id}`);
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null || price === "") {
            return "Not specified";
        }

        return `₹${Number(price).toLocaleString("en-IN")}`;
    };

return (
    <div
        onClick={() =>
            navigate("/course/description", {
                state: { ...data },
            })
        }
        className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-zinc-800 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
        {/* Thumbnail */}
        <div className="h-48 w-full shrink-0 overflow-hidden">
            <img
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                src={data?.thumbnail?.secure_url}
                alt={data?.title || "Course thumbnail"}
            />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
            <h2 className="line-clamp-2 break-words text-xl font-bold text-yellow-400">
                {data?.title}
            </h2>

            <p className="line-clamp-2 break-words text-sm leading-5 text-zinc-300">
                {data?.description}
            </p>

            <p className="break-words text-sm">
                <span className="font-semibold text-yellow-400">
                    Category:{" "}
                </span>
                {data?.category || "Not specified"}
            </p>

            <p className="truncate text-sm">
                <span className="font-semibold text-yellow-400">
                    Instructor:{" "}
                </span>
                {data?.createdBy || "Not specified"}
            </p>

            <div className="mt-1 grid grid-cols-2 gap-3">
                <div className="min-w-0 rounded-xl border border-yellow-500/20 bg-zinc-700/70 p-3">
                    <p className="text-xs text-zinc-400">Course Price</p>
                    <p className="mt-1 truncate font-bold text-yellow-400">
                        {formatPrice(data?.price)}
                    </p>
                </div>

                <div className="min-w-0 rounded-xl border border-yellow-500/20 bg-zinc-700/70 p-3">
                    <p className="text-xs text-zinc-400">Duration</p>
                    <p className="mt-1 break-words font-bold">
                        {data?.duration || "Not specified"}
                    </p>
                </div>
            </div>

            <p className="text-sm">
                <span className="font-semibold text-yellow-400">
                    Total lectures:{" "}
                </span>
                {data?.numberoflectures ?? 0}
            </p>

            {canEdit && (
                <button
                    type="button"
                    onClick={handleEdit}
                    className="mt-auto w-full rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
                >
                    Edit Course
                </button>
            )}
        </div>
    </div>
);

}

export default CourseCard;

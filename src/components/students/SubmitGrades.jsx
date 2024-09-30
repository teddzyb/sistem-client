import api from '@/src/common/api';
import { Button, FormControl, Typography } from '@mui/material';
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdCloudUpload } from 'react-icons/md';

const SubmitGrades = ({setIsSubmitting, setHideFileUpload, setGrades,setRows, setGradeSemester, user}) => {
    const { control, handleSubmit, setValue } = useForm();
    const [fileName, setFileName] = useState('');


    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
        accept: ['application/pdf'],
        onDrop: (accepted) => {
            if (accepted.length === 0 || accepted[0].type !== 'application/pdf') {
                toast.error('Upload invalid, unsupported file type!', {
                    duration: 3000,
                    style: {
                        background: '#f44336',
                        color: '#fff',
                    },
                    position: 'bottom-right',
                });
            }
            else {
                setValue('file', accepted[0]);
                setFileName(accepted[0].name);
            }

        },
    });

    const groupCoursesByYearAndSemester = (courses) => {

        return courses.reduce((acc, course) => {
            const key = `${course.semester}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({
                courseCode: course.courseCode,
                courseDesc: course.description,
                semester: course.semester,
                units: course.units,
                finalGrade: course.finalGrade,
                verdict: course.verdict,
            });
            return acc;
        }, {});
    };

    const handleFileSubmit = async (data) => {
        setIsSubmitting(true);
        setHideFileUpload(true);
        const studentId = user.idNumber;
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('studentId', studentId);

        try {
            const response = await api.submitGrades(formData);

            if (response.status === 200) {

                const grades = response.data.data;
                let sem = [];
                let takenCourses = []
                grades.courses.forEach((gradeInfo, index) => {
                    takenCourses.push({
                        id: index,
                        courseCode: gradeInfo.courseCode,
                        description: gradeInfo.courseDesc,
                        semester: gradeInfo.semester,
                        units: gradeInfo.units,
                        finalGrade: gradeInfo.finalGrade,
                        verdict: gradeInfo.isPassed ? "PASSED" : "FAILED",
                    });
                    if (!sem.includes(gradeInfo.semester)) {
                        sem.push(gradeInfo.semester);
                    }
                });

                setGrades(grades);

                const groupedTakenCourses = groupCoursesByYearAndSemester(takenCourses);
                setRows(groupedTakenCourses);
                setGradeSemester(sem);
                toast.success('Grades parsed successfully', {
                    duration: 3000,
                    style: {
                        background: '#4caf50',
                        color: '#fff',
                    },
                    position: 'bottom-right',
                });

            } else {
                toast.error('Something went wrong', {
                    duration: 3000,
                    style: {
                        background: '#f44336',
                        color: '#fff',
                    },
                    position: 'bottom-right',
                });
            }

            setIsSubmitting(false);

        } catch (error) {
            if (error) {
                toast.error('Cannot parse data from PDF, Data is invalid or manipulated by user', {
                    duration: 8000,
                    style: {
                        background: '#f44336',
                        color: '#fff',
                    },
                    position: 'bottom-right',
                });
                setIsSubmitting(false);
            }
        }
    };

  return (
    <div>
          <form onSubmit={handleSubmit(handleFileSubmit)} className='flex flex-col justify-center items-center'>
              <FormControl>
                  <Controller
                      name='file'
                      control={control}
                      rules={{ required: 'File is required' }}
                      render={({ field: { onChange, onBlur, value, ref } }) => (
                          <div
                              {...getRootProps()}
                              className={`w-full h-28 border-2 border-dashed border-gray-400 rounded-md flex justify-center items-center space-x-6 cursor-pointer p-4 ${fileName ? 'text-teal-600' : 'text-gray-400'
                                  } hover:text-gray-500 transition duration-300 ease-in-out`}
                          >
                              <input {...getInputProps()} />
                              <MdCloudUpload className='text-[4em]' />
                              <Typography variant='caption'>{fileName ? fileName : 'Upload your file in PDF format'}</Typography>
                          </div>
                      )}
                  />
              </FormControl>
              <Button type='submit' size='small' className='mt-3 w-fit bg-teal-600' variant='contained' sx={{ marginLeft: '2em' }}>
                  Submit
              </Button>
          </form>
    </div>
  )
}

export default SubmitGrades
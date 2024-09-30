"use client";
import api from "@/src/common/api";
import {Box, IconButton, Tooltip, Typography} from "@mui/material";
import moment from "moment";
import {useRouter} from "next/navigation";
import React, {useCallback, useEffect, useState} from "react";
import {AiOutlineEye} from "react-icons/ai";
import Table from "../shared/Table";
import { getSession } from "next-auth/react";
import { authConfig } from "@/src/app/lib/auth";
import { getUser } from "@/src/app/lib/loginClient";

const SpecialRequestTable = ({rowParams, isCurrentSem}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const router = useRouter();

  const fetchRequests = useCallback(async (user) => {
    try {
      setIsLoading(true);
      const response = await api.getStudentSpecialRequests(user._id);
      let data = [];
      response?.data?.specialRequests.forEach((request) => {
        data.push({
          id: request._id,
          concern: request.concern.requestTitle,
          dateCreated: request.createdAt,
          lastUpdated: request.updatedAt ? request.updatedAt : request.createdAt,
          courses: request.coursesAssociated
            .map((course) => course.course)
            .join("   |   "),
          status:
            request.statusTrail.isCancelled != null
              ? request.statusTrail.isCancelled
              : request.statusTrail.inProgress
              ? "In Progress"
              : !request.statusTrail.coordinatorApproval.approvedBy
              ? "Pending"
              : !request.statusTrail.coordinatorApproval.isApproved ||
                (!request.statusTrail.chairApproval.isApproved &&
                    request.statusTrail.chairApproval.dateApproved != null)
              ? "Rejected"
              : request.statusTrail.chairApproval.isApproved
              ? "Approved by Chair"
              : "Endorsed by Coordinator",
        });
      });
      data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setRows(data);
      localStorage.setItem("specialRequestCount", data.length);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const columns = [
    {
      field: "concern",
      headerName: "Concern",
      flex: 1,
      headerClassName: "bg-teal-600 text-white",
      align: "center",
      headerAlign: "center",
    },
    {
      field: "courses",
      headerName: "Courses",
      flex: 3,
      headerClassName: "bg-teal-600 text-white",
      align: "left",
      headerAlign: "left",
    },
    {
      field: "dateCreated",
      headerName: "Date Created",
      flex: 1,
      // maxWidth: 500,
      headerClassName: "bg-teal-600 text-white",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        return <>{moment(params.value).format("ll")}</>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      sortable: false,
      flex: 1,
      headerClassName: "bg-teal-600 text-white",
      align: "center",
      headerAlign: "center",
    },
    {
      field: "lastUpdated",
      headerName: "Last Updated",
      flex: 1,
      headerClassName: "bg-teal-600 text-white",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        return <>{moment(params.value).format("ll")}</>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      flex: 1,
      headerClassName: "bg-teal-600 text-white",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box className="flex justify-between">
            <Tooltip title="View Details">
              <IconButton
                onClick={() => {
                  router.push(`/enrollment/all-requests/${row.id}`);
                }}
              >
                <AiOutlineEye className="text-green-600" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    const init = async () => {
      const user = await getUser()

      if (isCurrentSem) {
        fetchRequests(user);
      } else {
        setIsLoading(true);
        if (rowParams === undefined || rowParams === null) {
          setRows([]);
        } else {
          setRows(rowParams);
        }
        setIsLoading(false);
      }

    }

    init()


  }, [rowParams, isCurrentSem]);

  return (
    <div>
      <Table rows={rows} columns={columns} isLoading={isLoading} />
    </div>
  );
};

export default SpecialRequestTable;

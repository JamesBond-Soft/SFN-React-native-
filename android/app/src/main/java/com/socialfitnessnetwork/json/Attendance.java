package com.socialfitnessnetwork.json;

/**
 * Created by johnbernardo on 7/8/17.
 * Remains java for interop with Gson serialization
 */
public class Attendance {
    public int id;
    public int member;
    public int gym;
    // TODO Find a way to convert these from Date
//    public Date createdAt;
//    public Date updatedAt;
    public String status;
    public Integer resolvedByUser;
    public Integer initiatedByUser;
    public Attendance(
        final int id,
        final int member,
        final int gym,
//        final Date createdAt,
//        final Date updatedAt,
        final String status,
        final Integer resolvedByUser,
        final Integer initiatedByUser
    ) {
        this.id = id;
        this.member = member;
        this.gym = gym;
//        this.createdAt = createdAt;
//        this.updatedAt = updatedAt;
        this.status = status;
        this.resolvedByUser = resolvedByUser;
        this.initiatedByUser = initiatedByUser;
    }

    public Attendance(){}
}

package cn.iocoder.yudao.module.edu.dal.mysql;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduWebsiteOfferingDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface EduWebsiteOfferingMapper extends BaseMapperX<EduWebsiteOfferingDO> {
    @Update("""
        UPDATE edu_website_offering
           SET title = #{row.title}, description = #{row.description}, outline = #{row.outline},
               stage = #{row.stage}, image = #{row.image}, sort_order = #{row.sortOrder},
               course_id = #{row.courseId}, revision = revision + 1,
               updater = #{row.updater}, update_time = CURRENT_TIMESTAMP(3)
         WHERE id = #{row.id} AND tenant_id = #{tenantId} AND deleted = b'0'
           AND slug = #{row.slug} AND revision = #{expectedRevision}
        """)
    int updateContent(@Param("row") EduWebsiteOfferingDO row,
                      @Param("tenantId") Long tenantId,
                      @Param("expectedRevision") Integer expectedRevision);

    @Update("""
        UPDATE edu_website_offering
           SET published = #{published}, revision = revision + 1,
               updater = #{updater}, update_time = CURRENT_TIMESTAMP(3)
         WHERE id = #{id} AND tenant_id = #{tenantId} AND deleted = b'0'
           AND revision = #{expectedRevision}
        """)
    int updatePublished(@Param("id") Long id, @Param("tenantId") Long tenantId,
                        @Param("expectedRevision") Integer expectedRevision,
                        @Param("published") Boolean published, @Param("updater") String updater);
}

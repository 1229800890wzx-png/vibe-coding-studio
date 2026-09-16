package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.product.api.sku.ProductSkuApi;
import cn.iocoder.yudao.module.product.api.sku.dto.*;
import cn.iocoder.yudao.module.product.controller.admin.brand.vo.ProductBrandCreateReqVO;
import cn.iocoder.yudao.module.product.controller.admin.category.vo.ProductCategorySaveReqVO;
import cn.iocoder.yudao.module.product.controller.admin.property.vo.property.ProductPropertySaveReqVO;
import cn.iocoder.yudao.module.product.controller.admin.property.vo.value.ProductPropertyValueSaveReqVO;
import cn.iocoder.yudao.module.product.controller.admin.spu.vo.*;
import cn.iocoder.yudao.module.product.dal.dataobject.sku.ProductSkuDO;
import cn.iocoder.yudao.module.product.dal.mysql.brand.ProductBrandMapper;
import cn.iocoder.yudao.module.product.dal.mysql.category.ProductCategoryMapper;
import cn.iocoder.yudao.module.product.dal.mysql.property.ProductPropertyMapper;
import cn.iocoder.yudao.module.product.dal.mysql.sku.ProductSkuMapper;
import cn.iocoder.yudao.module.product.service.brand.ProductBrandService;
import cn.iocoder.yudao.module.product.service.category.ProductCategoryService;
import cn.iocoder.yudao.module.product.service.property.*;
import cn.iocoder.yudao.module.product.service.sku.ProductSkuService;
import cn.iocoder.yudao.module.product.service.spu.ProductSpuService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** Adapts education records to the existing product services; no independent prices or seat balance. */
@Service
public class EduProductService {
    @Resource private ProductSpuService spuService;
    @Resource private ProductSkuService skuService;
    @Resource private ProductSkuApi skuApi;
    @Resource private ProductSkuMapper skuMapper;
    @Resource private ProductCategoryService categoryService;
    @Resource private ProductCategoryMapper categoryMapper;
    @Resource private ProductBrandService brandService;
    @Resource private ProductBrandMapper brandMapper;
    @Resource private ProductPropertyService propertyService;
    @Resource private ProductPropertyMapper propertyMapper;
    @Resource private ProductPropertyValueService valueService;
    @Resource private EduCourseMapper courses;

    public ProductSkuRespDTO sku(Long id) { return id==null?null:skuApi.getSku(id); }
    public void stock(Long skuId,int delta) {
        skuApi.updateSkuStock(new ProductSkuUpdateStockReqDTO(List.of(new ProductSkuUpdateStockReqDTO.Item().setId(skuId).setIncrCount(delta))));
    }
    @Transactional(rollbackFor=Exception.class)
    public Long bindSku(EduCourseDO course,EduCohortDO cohort,int price) {
        require(price>=0,"课程金额不能为负数");
        if(cohort.getSkuId()!=null) {
            ProductSkuRespDTO existing=found(sku(cohort.getSkuId()),"关联的商品规格不存在");
            require(course.getSpuId()!=null&&Objects.equals(existing.getSpuId(),course.getSpuId()),"班期规格必须属于该课程商品");
            return existing.getId();
        }
        String cover=found(course.getCoverUrl(),"请先配置课程封面"); require(!cover.isBlank(),"请先配置课程封面");
        var property=propertyMapper.selectOne("name","VIBE 班期");
        Long propertyId=property==null?propertyService.createProperty(new ProductPropertySaveReqVO().setName("VIBE 班期").setRemark("由教育班期维护，已关联规格不得删除")):property.getId();
        Long valueId=valueService.createPropertyValue(new ProductPropertyValueSaveReqVO().setPropertyId(propertyId).setName(cohort.getName()+" #"+cohort.getId()).setRemark("教育班期"));
        ProductSkuSaveReqVO sku=new ProductSkuSaveReqVO().setName(cohort.getName()).setPrice(price).setMarketPrice(price).setCostPrice(0)
            .setPicUrl(cover).setStock(cohort.getCapacity()).setWeight(0d).setVolume(0d).setFirstBrokeragePrice(0).setSecondBrokeragePrice(0)
            .setProperties(List.of(new ProductSkuSaveReqVO.Property(propertyId,"VIBE 班期",valueId,cohort.getName())));
        if(course.getSpuId()==null) {
            var brand=brandMapper.selectOne("name","VIBE CODING");
            ProductBrandCreateReqVO brandRequest=new ProductBrandCreateReqVO();
            brandRequest.setName("VIBE CODING").setPicUrl(cover).setSort(0).setStatus(0).setDescription("少儿创造力实验室");
            Long brandId=brand==null?brandService.createBrand(brandRequest):brand.getId();
            var parent=categoryMapper.selectOne("name","VIBE 教育");
            Long parentId=parent==null?categoryService.createCategory(new ProductCategorySaveReqVO().setParentId(0L).setName("VIBE 教育").setPicUrl(cover).setSort(0).setStatus(0)):parent.getId();
            var leaf=categoryMapper.selectOne("parent_id",parentId,"name","项目课程");
            Long categoryId=leaf==null?categoryService.createCategory(new ProductCategorySaveReqVO().setParentId(parentId).setName("项目课程").setPicUrl(cover).setSort(0).setStatus(0)):leaf.getId();
            ProductSpuSaveReqVO request=new ProductSpuSaveReqVO().setName(course.getName()).setKeyword(course.getCode()).setIntroduction(course.getName())
                .setDescription(course.getDescription()==null?course.getName():course.getDescription()).setCategoryId(categoryId).setBrandId(brandId)
                .setPicUrl(cover).setSliderPicUrls(List.of(cover)).setSort(0).setSpecType(true).setDeliveryTypes(List.of(3)).setGiveIntegral(0)
                .setSubCommissionType(false).setVirtualSalesCount(0).setSkus(List.of(sku));
            Long spuId=spuService.createSpu(request); course.setSpuId(spuId); courses.updateById(course);
            // Draft education products must not appear for sale through the original storefront.
            spuService.updateSpuStatus(new ProductSpuUpdateStatusReqVO().setId(spuId).setStatus(0));
        } else {
            skuService.validateSkuList(List.of(sku),true);
            skuService.createSkuList(course.getSpuId(),List.of(sku));
            spuService.updateSpuStock(Map.of(course.getSpuId(),cohort.getCapacity()));
            spuService.refreshSpuPrice(course.getSpuId());
        }
        return skuService.getSkuListBySpuId(course.getSpuId()).stream()
            .filter(s->s.getProperties()!=null&&s.getProperties().stream().anyMatch(p->Objects.equals(p.getValueId(),valueId)))
            .map(ProductSkuDO::getId).findFirst().orElseThrow(()->new IllegalStateException("原商品服务未返回创建的班期规格"));
    }
    public void publishProduct(Long spuId) { spuService.updateSpuStatus(new ProductSpuUpdateStatusReqVO().setId(spuId).setStatus(1)); }
    public void updateDraftSku(Long skuId,Integer price,int capacityDelta) {
        if(price!=null) { require(price>=0,"价格不能为负数"); ProductSkuDO current=found(skuMapper.selectById(skuId),"班期规格不存在");skuMapper.updateById(new ProductSkuDO().setId(skuId).setPrice(price).setMarketPrice(price));spuService.refreshSpuPrice(current.getSpuId()); }
        if(capacityDelta!=0) stock(skuId,capacityDelta);
    }
}
